package com.mindarena.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nickname;
    private String avatar = "⚔️";
    private Integer score = 0;
    private Integer streak = 0;
    private boolean usedBlind = false;
    private boolean usedHint = false;

    @ManyToOne
    @JoinColumn(name = "game_session_id")
    @JsonIgnore
    private GameSession gameSession;

    public Player() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getAvatar() { return (avatar != null && !avatar.isBlank()) ? avatar : "⚔️"; }
    public void setAvatar(String avatar) { this.avatar = (avatar != null && !avatar.isBlank()) ? avatar : "⚔️"; }
    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }
    public Integer getStreak() { return streak; }
    public void setStreak(Integer streak) { this.streak = streak; }
    public void incrementStreak() { this.streak++; }
    public void resetStreak() { this.streak = 0; }
    public boolean isUsedBlind() { return usedBlind; }
    public void setUsedBlind(boolean usedBlind) { this.usedBlind = usedBlind; }
    public boolean isUsedHint() { return usedHint; }
    public void setUsedHint(boolean usedHint) { this.usedHint = usedHint; }
    
    public GameSession getGameSession() { return gameSession; }
    public void setGameSession(GameSession gameSession) { this.gameSession = gameSession; }
    
    public void addScore(int points) {
        this.score += points;
    }
}
