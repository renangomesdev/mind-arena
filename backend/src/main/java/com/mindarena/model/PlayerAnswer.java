package com.mindarena.model;

import jakarta.persistence.*;

@Entity
public class PlayerAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne
    @JoinColumn(name = "answer_option_id")
    private AnswerOption answerOption;

    private Integer timeTakenMs;
    private Integer pointsAwarded;

    public PlayerAnswer() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Player getPlayer() { return player; }
    public void setPlayer(Player player) { this.player = player; }
    public Question getQuestion() { return question; }
    public void setQuestion(Question question) { this.question = question; }
    public AnswerOption getAnswerOption() { return answerOption; }
    public void setAnswerOption(AnswerOption answerOption) { this.answerOption = answerOption; }
    public Integer getTimeTakenMs() { return timeTakenMs; }
    public void setTimeTakenMs(Integer timeTakenMs) { this.timeTakenMs = timeTakenMs; }
    public Integer getPointsAwarded() { return pointsAwarded; }
    public void setPointsAwarded(Integer pointsAwarded) { this.pointsAwarded = pointsAwarded; }
}
