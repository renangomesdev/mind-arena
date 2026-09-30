package com.mindarena.repository;

import com.mindarena.model.SecurityAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityAuditLogRepository extends JpaRepository<SecurityAuditLog, Long> {
    List<SecurityAuditLog> findTop100ByOrderByTimestampDesc();
    long countByBlockedTrue();
    long countBySeverity(String severity);
}
