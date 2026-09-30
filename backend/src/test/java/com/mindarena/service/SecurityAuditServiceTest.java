package com.mindarena.service;

import com.mindarena.model.SecurityAuditLog;
import com.mindarena.repository.SecurityAuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class SecurityAuditServiceTest {

    private SecurityAuditLogRepository auditRepo;
    private SecurityAuditService auditService;

    @BeforeEach
    void setUp() {
        auditRepo = mock(SecurityAuditLogRepository.class);
        auditService = new SecurityAuditService(auditRepo);
    }

    @Test
    @DisplayName("Simulação de ataque SQL Injection deve ser catalogada como CRITICAL")
    void testSimulateSQLInjection() {
        when(auditRepo.save(any(SecurityAuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecurityAuditLog result = auditService.simulateThreat("192.0.2.45", "SQLI_PROBE");

        assertNotNull(result);
        assertEquals("SQLI_PROBE", result.getThreatType());
        assertEquals("CRITICAL", result.getSeverity());
        assertTrue(result.isBlocked());
        verify(auditRepo, times(1)).save(any(SecurityAuditLog.class));
    }

    @Test
    @DisplayName("Simulação de ataque SSRF deve registrar tentativa de IP de Metadata")
    void testSimulateSSRF() {
        when(auditRepo.save(any(SecurityAuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecurityAuditLog result = auditService.simulateThreat("192.0.2.45", "SSRF_PROBE");

        assertNotNull(result);
        assertEquals("SSRF_PROBE", result.getThreatType());
        assertEquals("CRITICAL", result.getSeverity());
        assertTrue(result.getRequestUri().contains("169.254.169.254"));
        assertTrue(result.isBlocked());
    }

    @Test
    @DisplayName("Simulação de DoS Flood deve ser catalogada como HIGH e bloqueada")
    void testSimulateDoSFlood() {
        when(auditRepo.save(any(SecurityAuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecurityAuditLog result = auditService.simulateThreat("192.0.2.45", "DOS_FLOOD");

        assertNotNull(result);
        assertEquals("DOS_FLOOD", result.getThreatType());
        assertEquals("HIGH", result.getSeverity());
        assertTrue(result.isBlocked());
    }

    @Test
    @DisplayName("Cálculo de métricas de telemetria de segurança")
    void testSecurityStats() {
        when(auditRepo.count()).thenReturn(150L);
        when(auditRepo.countByBlockedTrue()).thenReturn(148L);
        when(auditRepo.countBySeverity("CRITICAL")).thenReturn(12L);
        when(auditRepo.countBySeverity("HIGH")).thenReturn(45L);

        Map<String, Object> stats = auditService.getSecurityStats();

        assertEquals(150L, stats.get("totalThreats"));
        assertEquals(148L, stats.get("blockedThreats"));
        assertEquals(12L, stats.get("criticalThreats"));
        assertEquals(45L, stats.get("highThreats"));
    }
}
