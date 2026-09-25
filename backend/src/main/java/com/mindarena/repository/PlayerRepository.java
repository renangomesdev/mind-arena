package com.mindarena.repository;

import com.mindarena.model.Player;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByGameSessionIdOrderByScoreDesc(Long gameSessionId);
    boolean existsByGameSessionIdAndNickname(Long gameSessionId, String nickname);
}
