package com.mindarena.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;

@Entity
public class GameSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String code;

    @ManyToOne
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Enumerated(EnumType.STRING)
    private GameStatus status = GameStatus.WAITING;

    private boolean powersEnabled = false;

    private Integer currentQuestionIndex = -1;

    @OneToMany(mappedBy = "gameSession", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Player> players = new ArrayList<>();

    public GameSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }
    public GameStatus getStatus() { return status; }
    public void setStatus(GameStatus status) { this.status = status; }
    public boolean isPowersEnabled() { return powersEnabled; }
    public void setPowersEnabled(boolean powersEnabled) { this.powersEnabled = powersEnabled; }
    public Integer getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(Integer currentQuestionIndex) { this.currentQuestionIndex = currentQuestionIndex; }
    public List<Player> getPlayers() { return players; }
    public void setPlayers(List<Player> players) { this.players = players; }
    
    public void addPlayer(Player player) {
        players.add(player);
        player.setGameSession(this);
    }
}
