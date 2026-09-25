package com.mindarena.repository;

import com.mindarena.model.PlayerAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlayerAnswerRepository extends JpaRepository<PlayerAnswer, Long> {
    boolean existsByPlayerIdAndQuestionId(Long playerId, Long questionId);
}
