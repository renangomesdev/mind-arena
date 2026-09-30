package com.mindarena.config;

import com.mindarena.service.SecurityAuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Component
@Order(1)
public class SecurityAuditFilter extends OncePerRequestFilter {

    private final SecurityAuditService auditService;

    // Rate Limiting Cache: IP -> [timestamp, requestCount]
    private static final Map<String, RateTracker> RATE_LIMIT_CACHE = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_WINDOW = 40;
    private static final long WINDOW_MS = 5000; // 5 segundos

    // Patterns de Ataque e Varredura
    private static final Pattern FORBIDDEN_PATHS = Pattern.compile(
        "(?i).*(\\.env|\\.git|\\.aws|\\.htaccess|wp-admin|wp-login|wp-content|xmlrpc\\.php|phpmyadmin|adminer|actuator|swagger|api-docs|manager/html|solr|shell|cmd\\.exe).*"
    );

    private static final Pattern PATH_TRAVERSAL = Pattern.compile(
        "(?i).*(\\.\\./|\\.\\.\\\\|%2e%2e|/etc/passwd|/etc/shadow|win\\.ini).*"
    );

    private static final Pattern SSRF_PRIVATE_IPS = Pattern.compile(
        "(?i).*(169\\.254\\.169\\.254|localhost|127\\.0\\.0\\.1|10\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}|192\\.168\\.[0-9]{1,3}\\.[0-9]{1,3}|172\\.(1[6-9]|2[0-9]|3[0-1])\\.[0-9]{1,3}\\.[0-9]{1,3}).*"
    );

    private static final Pattern INJECTION_PATTERNS = Pattern.compile(
        "(?i).*('|%27).*(\\bor\\b|\\bunion\\b|\\bselect\\b|\\bdrop\\b|--|/\\*).*|.*(<script|javascript:|onerror=|onload=).*"
    );

    public SecurityAuditFilter(SecurityAuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = extractClientIp(request);
        String uri = request.getRequestURI();
        String queryString = request.getQueryString() != null ? request.getQueryString() : "";
        String fullTarget = uri + (queryString.isBlank() ? "" : "?" + queryString);
        String method = request.getMethod();
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) userAgent = "Unknown";

        // Excluir requisições internas de handshake do WebSocket de bloqueios acidentais
        boolean isWs = uri.startsWith("/ws");

        // 1. Verificação de Ataque DoS / Flood (Rate Limiting por IP)
        if (!isWs && isRateLimitExceeded(clientIp)) {
            auditService.recordEvent(
                clientIp, method, uri, "DOS_RATE_LIMIT_EXCEEDED", "HIGH",
                "IP excedeu a taxa máxima permitida (limite de 40 req/5s). Ataque DoS/Flood mitigado.",
                userAgent, true
            );
            sendSecurityError(response, 429, "Too Many Requests", "Taxa de requisições excedida. Sistema de proteção ativa acionado.");
            return;
        }

        // 2. Detecção de Probing em Recursos Sensíveis / Endpoints Proibidos
        if (FORBIDDEN_PATHS.matcher(uri).matches()) {
            auditService.recordEvent(
                clientIp, method, uri, "FORBIDDEN_RESOURCE_SCAN", "HIGH",
                "Varredura por arquivos confidenciais ou painéis administrativos não autorizados.",
                userAgent, true
            );
            sendSecurityError(response, 403, "Forbidden", "Acesso a recurso proibido registrado pelo sistema de auditoria.");
            return;
        }

        // 3. Detecção de Path Traversal
        if (PATH_TRAVERSAL.matcher(fullTarget).matches()) {
            auditService.recordEvent(
                clientIp, method, fullTarget, "PATH_TRAVERSAL_ATTEMPT", "HIGH",
                "Tentativa de navegação em diretórios restritos do servidor (Directory Traversal).",
                userAgent, true
            );
            sendSecurityError(response, 403, "Forbidden", "Tentativa de violação de caminho de arquivo bloqueada.");
            return;
        }

        // 4. Detecção de SSRF e Tentativa de Acesso a IPs Privados / Metadata Cloud
        if (!queryString.isBlank() && SSRF_PRIVATE_IPS.matcher(queryString).matches()) {
            auditService.recordEvent(
                clientIp, method, fullTarget, "SSRF_PRIVATE_IP_PROBE", "CRITICAL",
                "Tentativa de sondagem ou acesso a IPs privados ou serviço de Metadata da Nuvem (SSRF).",
                userAgent, true
            );
            sendSecurityError(response, 403, "Forbidden", "Acesso a endereços de rede privada proibido pela política de defesa.");
            return;
        }

        // 5. Detecção de Injeção de Código (SQLi / XSS em parâmetros)
        if (!queryString.isBlank() && INJECTION_PATTERNS.matcher(queryString).matches()) {
            auditService.recordEvent(
                clientIp, method, fullTarget, "INJECTION_ATTEMPT", "CRITICAL",
                "Payload malicioso de Injeção SQL ou Cross-Site Scripting (XSS) detectado nos parâmetros.",
                userAgent, true
            );
            sendSecurityError(response, 403, "Forbidden", "Payload malicioso neutralizado pela camada de defesa.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitExceeded(String clientIp) {
        long now = System.currentTimeMillis();
        RateTracker tracker = RATE_LIMIT_CACHE.compute(clientIp, (k, v) -> {
            if (v == null || (now - v.windowStartTime) > WINDOW_MS) {
                return new RateTracker(now, 1);
            }
            v.count++;
            return v;
        });
        return tracker.count > MAX_REQUESTS_PER_WINDOW;
    }

    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void sendSecurityError(HttpServletResponse response, int status, String error, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(String.format(
            "{\"status\": %d, \"error\": \"%s\", \"security_alert\": true, \"message\": \"%s\"}",
            status, error, message
        ));
    }

    private static class RateTracker {
        long windowStartTime;
        int count;

        RateTracker(long windowStartTime, int count) {
            this.windowStartTime = windowStartTime;
            this.count = count;
        }
    }
}
