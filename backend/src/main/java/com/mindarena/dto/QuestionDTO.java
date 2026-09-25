package com.mindarena.dto;

import java.util.List;

public class QuestionDTO {
    private Long id;
    private String text;
    private String hint;
    private Integer timeLimitSeconds;
    private Integer orderIndex;
    private List<AnswerOptionDTO> options;

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
    public List<AnswerOptionDTO> getOptions() { return options; }
    public void setOptions(List<AnswerOptionDTO> options) { this.options = options; }
}
