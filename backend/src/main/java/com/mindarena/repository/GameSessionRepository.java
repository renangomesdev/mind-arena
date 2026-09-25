package com.mindarena.repository;

import com.mindarena.model.GameSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GameSessionRepository extends JpaRepository<GameSession, Long> {
    Optional<GameSession> findByCode(String code);
}
