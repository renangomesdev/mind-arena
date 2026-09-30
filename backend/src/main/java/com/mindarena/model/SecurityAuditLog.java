package com.mindarena.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_audit_log")
public class SecurityAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime timestamp;
    private String clientIp;
    private String httpMethod;

    @Column(length = 1000)
    private String requestUri;

    private String threatType;
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(length = 2000)
    private String details;

    @Column(length = 500)
    private String userAgent;

    private boolean blocked;

    public SecurityAuditLog() {}

    public SecurityAuditLog(String clientIp, String httpMethod, String requestUri,
                            String threatType, String severity, String details,
                            String userAgent, boolean blocked) {
        this.timestamp = LocalDateTime.now();
        this.clientIp = clientIp;
        this.httpMethod = httpMethod;
        this.requestUri = requestUri;
        this.threatType = threatType;
        this.severity = severity;
        this.details = details;
        this.userAgent = userAgent;
        this.blocked = blocked;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }
    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }
    public String getRequestUri() { return requestUri; }
    public void setRequestUri(String requestUri) { this.requestUri = requestUri; }
    public String getThreatType() { return threatType; }
    public void setThreatType(String threatType) { this.threatType = threatType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public boolean isBlocked() { return blocked; }
    public void setBlocked(boolean blocked) { this.blocked = blocked; }
}
