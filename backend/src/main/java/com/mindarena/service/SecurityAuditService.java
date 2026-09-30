package com.mindarena.service;

import com.mindarena.model.SecurityAuditLog;
import com.mindarena.repository.SecurityAuditLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SecurityAuditService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);
    private final SecurityAuditLogRepository auditRepo;

    public SecurityAuditService(SecurityAuditLogRepository auditRepo) {
        this.auditRepo = auditRepo;
    }

    public SecurityAuditLog recordEvent(String clientIp, String method, String uri,
                                        String threatType, String severity, String details,
                                        String userAgent, boolean blocked) {
        try {
            SecurityAuditLog auditLog = new SecurityAuditLog(
                clientIp, method, uri, threatType, severity, details, userAgent, blocked
            );
            
            log.warn("[SECURITY-ALERT] [{}] IP: {} | Threat: {} | Severity: {} | URI: {} | Details: {}",
                blocked ? "BLOCKED" : "AUDITED", clientIp, threatType, severity, uri, details);
            
            return auditRepo.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to record security audit log: {}", e.getMessage());
            return null;
        }
    }

    public List<SecurityAuditLog> getRecentLogs() {
        return auditRepo.findTop100ByOrderByTimestampDesc();
    }

    public Map<String, Object> getSecurityStats() {
        long totalThreats = auditRepo.count();
        long blockedThreats = auditRepo.countByBlockedTrue();
        long criticalThreats = auditRepo.countBySeverity("CRITICAL");
        long highThreats = auditRepo.countBySeverity("HIGH");

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalThreats", totalThreats);
        stats.put("blockedThreats", blockedThreats);
        stats.put("criticalThreats", criticalThreats);
        stats.put("highThreats", highThreats);
        return stats;
    }

    public SecurityAuditLog simulateThreat(String clientIp, String threatType) {
        String uri = "/simulation-attack-test";
        String severity = "HIGH";
        String details = "Simulação acadêmica acionada para demonstração de defesa cibernética em tempo real.";
        if ("SSRF_PROBE".equalsIgnoreCase(threatType)) {
            uri = "/api/proxy?target=http://169.254.169.254/opc/v1/instance/";
            severity = "CRITICAL";
            details = "Tentativa simulada de acesso a IP privado de Metadata da Nuvem (SSRF).";
        } else if ("SQLI_PROBE".equalsIgnoreCase(threatType)) {
            uri = "/api/quizzes?search=1' UNION SELECT username,password FROM users--";
            severity = "CRITICAL";
            details = "Tentativa simulada de injeção SQL no catálogo de dados.";
        } else if ("DOS_FLOOD".equalsIgnoreCase(threatType)) {
            uri = "/api/games/flood-probe";
            severity = "HIGH";
            details = "Simulação de disparo em alta frequência (Rate Limit / DoS Mitigado).";
        }
        return recordEvent(clientIp, "POST", uri, threatType.toUpperCase(), severity, details, "Security-Test-Agent/1.0", true);
    }
}
