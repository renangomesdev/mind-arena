package com.mindarena.repository;

import com.mindarena.model.PlayerAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerAnswerRepository extends JpaRepository<PlayerAnswer, Long> {
    boolean existsByPlayerIdAndQuestionId(Long playerId, Long questionId);
    List<PlayerAnswer> findByQuestionIdAndPlayerGameSessionId(Long questionId, Long gameSessionId);
    List<PlayerAnswer> findByPlayerGameSessionId(Long gameSessionId);
    List<PlayerAnswer> findByPlayerId(Long playerId);
}
