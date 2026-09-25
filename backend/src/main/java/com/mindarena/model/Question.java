package com.mindarena.model;

import jakarta.persistence.*;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String text;
    private String hint;
    private Integer timeLimitSeconds;
    private Integer orderIndex;

    @ManyToOne
    @JoinColumn(name = "quiz_id")
    @JsonIgnore
    private Quiz quiz;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnswerOption> options = new ArrayList<>();

    public Question() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }
    public Integer getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(Integer timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }
    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
    public Quiz getQuiz() { return quiz; }
    public void setQuiz(Quiz quiz) { this.quiz = quiz; }
    public List<AnswerOption> getOptions() { return options; }
    public void setOptions(List<AnswerOption> options) { this.options = options; }
    
    public void addOption(AnswerOption option) {
        options.add(option);
        option.setQuestion(this);
    }
}
