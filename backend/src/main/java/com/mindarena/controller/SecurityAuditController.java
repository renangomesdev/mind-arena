package com.mindarena.controller;

import com.mindarena.model.SecurityAuditLog;
import com.mindarena.service.SecurityAuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/security-logs")
public class SecurityAuditController {

    private final SecurityAuditService auditService;

    public SecurityAuditController(SecurityAuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    public List<SecurityAuditLog> getRecentLogs() {
        return auditService.getRecentLogs();
    }

    @GetMapping("/stats")
    public Map<String, Object> getSecurityStats() {
        return auditService.getSecurityStats();
    }

    @PostMapping("/simulate")
    public ResponseEntity<SecurityAuditLog> simulateAttack(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isBlank()) {
            clientIp = request.getRemoteAddr();
        } else {
            clientIp = clientIp.split(",")[0].trim();
        }
        String threatType = body != null && body.containsKey("threatType") ? body.get("threatType") : "SQLI_PROBE";
        SecurityAuditLog log = auditService.simulateThreat(clientIp, threatType);
        return ResponseEntity.ok(log);
    }
}
