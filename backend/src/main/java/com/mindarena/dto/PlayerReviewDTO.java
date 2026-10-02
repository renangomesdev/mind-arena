package com.mindarena.dto;

import java.util.List;

public class PlayerReviewDTO {
    private Long playerId;
    private String nickname;
    private String avatar;
    private int finalScore;
    private int rank;
    private int totalQuestions;
    private int correctCount;
    private double accuracyPercentage;
    private List<QuestionReviewDTO> questions;

    public PlayerReviewDTO() {}

    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public int getFinalScore() { return finalScore; }
    public void setFinalScore(int finalScore) { this.finalScore = finalScore; }

    public int getRank() { return rank; }
    public void setRank(int rank) { this.rank = rank; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getCorrectCount() { return correctCount; }
    public void setCorrectCount(int correctCount) { this.correctCount = correctCount; }

    public double getAccuracyPercentage() { return accuracyPercentage; }
    public void setAccuracyPercentage(double accuracyPercentage) { this.accuracyPercentage = accuracyPercentage; }

    public List<QuestionReviewDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionReviewDTO> questions) { this.questions = questions; }

    public static class QuestionReviewDTO {
        private Long questionId;
        private int orderIndex;
        private String questionText;
        private Long selectedOptionId;
        private String selectedOptionText;
        private Long correctOptionId;
        private String correctOptionText;
        private boolean correct;
        private int pointsAwarded;
        private int timeTakenMs;
        private String hint;

        public QuestionReviewDTO() {}

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public int getOrderIndex() { return orderIndex; }
        public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

        public String getQuestionText() { return questionText; }
        public void setQuestionText(String questionText) { this.questionText = questionText; }

        public Long getSelectedOptionId() { return selectedOptionId; }
        public void setSelectedOptionId(Long selectedOptionId) { this.selectedOptionId = selectedOptionId; }

        public String getSelectedOptionText() { return selectedOptionText; }
        public void setSelectedOptionText(String selectedOptionText) { this.selectedOptionText = selectedOptionText; }

        public Long getCorrectOptionId() { return correctOptionId; }
        public void setCorrectOptionId(Long correctOptionId) { this.correctOptionId = correctOptionId; }

        public String getCorrectOptionText() { return correctOptionText; }
        public void setCorrectOptionText(String correctOptionText) { this.correctOptionText = correctOptionText; }

        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }

        public int getPointsAwarded() { return pointsAwarded; }
        public void setPointsAwarded(int pointsAwarded) { this.pointsAwarded = pointsAwarded; }

        public int getTimeTakenMs() { return timeTakenMs; }
        public void setTimeTakenMs(int timeTakenMs) { this.timeTakenMs = timeTakenMs; }

        public String getHint() { return hint; }
        public void setHint(String hint) { this.hint = hint; }
    }
}
