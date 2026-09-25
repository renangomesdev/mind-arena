package com.mindarena.dto;

public class AnswerOptionDTO {
    private Long id;
    private String text;
    private boolean isCorrect;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getText() { return text; }
    public void setText(String text) { this.text = text; }
    public boolean getIsCorrect() { return isCorrect; }
    public void setIsCorrect(boolean correct) { this.isCorrect = correct; }
}
