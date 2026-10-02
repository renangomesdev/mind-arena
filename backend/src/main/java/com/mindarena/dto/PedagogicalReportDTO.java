package com.mindarena.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PedagogicalReportDTO {
    private String gameCode;
    private String quizTitle;
    private String quizDescription;
    private LocalDateTime generatedAt;
    private int totalPlayers;
    private int totalQuestions;
    private int totalAnswers;
    private double overallAccuracyPercentage;
    private double averageTimeTakenSeconds;
    private HighlightQuestionDTO mostMasteredQuestion;
    private HighlightQuestionDTO mostChallengingQuestion;
    private List<QuestionStatDTO> questions;

    public PedagogicalReportDTO() {}

    public String getGameCode() { return gameCode; }
    public void setGameCode(String gameCode) { this.gameCode = gameCode; }

    public String getQuizTitle() { return quizTitle; }
    public void setQuizTitle(String quizTitle) { this.quizTitle = quizTitle; }

    public String getQuizDescription() { return quizDescription; }
    public void setQuizDescription(String quizDescription) { this.quizDescription = quizDescription; }

    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }

    public int getTotalPlayers() { return totalPlayers; }
    public void setTotalPlayers(int totalPlayers) { this.totalPlayers = totalPlayers; }

    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }

    public int getTotalAnswers() { return totalAnswers; }
    public void setTotalAnswers(int totalAnswers) { this.totalAnswers = totalAnswers; }

    public double getOverallAccuracyPercentage() { return overallAccuracyPercentage; }
    public void setOverallAccuracyPercentage(double overallAccuracyPercentage) { this.overallAccuracyPercentage = overallAccuracyPercentage; }

    public double getAverageTimeTakenSeconds() { return averageTimeTakenSeconds; }
    public void setAverageTimeTakenSeconds(double averageTimeTakenSeconds) { this.averageTimeTakenSeconds = averageTimeTakenSeconds; }

    public HighlightQuestionDTO getMostMasteredQuestion() { return mostMasteredQuestion; }
    public void setMostMasteredQuestion(HighlightQuestionDTO mostMasteredQuestion) { this.mostMasteredQuestion = mostMasteredQuestion; }

    public HighlightQuestionDTO getMostChallengingQuestion() { return mostChallengingQuestion; }
    public void setMostChallengingQuestion(HighlightQuestionDTO mostChallengingQuestion) { this.mostChallengingQuestion = mostChallengingQuestion; }

    public List<QuestionStatDTO> getQuestions() { return questions; }
    public void setQuestions(List<QuestionStatDTO> questions) { this.questions = questions; }

    public static class HighlightQuestionDTO {
        private Long questionId;
        private int orderIndex;
        private String text;
        private double accuracyPercentage;
        private String topMistakeOptionText;
        private double topMistakePercentage;

        public HighlightQuestionDTO() {}

        public HighlightQuestionDTO(Long questionId, int orderIndex, String text, double accuracyPercentage, String topMistakeOptionText, double topMistakePercentage) {
            this.questionId = questionId;
            this.orderIndex = orderIndex;
            this.text = text;
            this.accuracyPercentage = accuracyPercentage;
            this.topMistakeOptionText = topMistakeOptionText;
            this.topMistakePercentage = topMistakePercentage;
        }

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public int getOrderIndex() { return orderIndex; }
        public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public double getAccuracyPercentage() { return accuracyPercentage; }
        public void setAccuracyPercentage(double accuracyPercentage) { this.accuracyPercentage = accuracyPercentage; }

        public String getTopMistakeOptionText() { return topMistakeOptionText; }
        public void setTopMistakeOptionText(String topMistakeOptionText) { this.topMistakeOptionText = topMistakeOptionText; }

        public double getTopMistakePercentage() { return topMistakePercentage; }
        public void setTopMistakePercentage(double topMistakePercentage) { this.topMistakePercentage = topMistakePercentage; }
    }

    public static class QuestionStatDTO {
        private Long questionId;
        private int orderIndex;
        private String text;
        private int totalAnswers;
        private int correctAnswers;
        private double accuracyPercentage;
        private double averageTimeSeconds;
        private String pedagogicalDiagnosis; // "CONSOLIDADO", "BOM", "PONTO DE ATENÇÃO", "CRÍTICO"
        private String topMistakeOptionText;
        private double topMistakePercentage;
        private List<OptionStatDTO> options;

        public QuestionStatDTO() {}

        public Long getQuestionId() { return questionId; }
        public void setQuestionId(Long questionId) { this.questionId = questionId; }

        public int getOrderIndex() { return orderIndex; }
        public void setOrderIndex(int orderIndex) { this.orderIndex = orderIndex; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public int getTotalAnswers() { return totalAnswers; }
        public void setTotalAnswers(int totalAnswers) { this.totalAnswers = totalAnswers; }

        public int getCorrectAnswers() { return correctAnswers; }
        public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }

        public double getAccuracyPercentage() { return accuracyPercentage; }
        public void setAccuracyPercentage(double accuracyPercentage) { this.accuracyPercentage = accuracyPercentage; }

        public double getAverageTimeSeconds() { return averageTimeSeconds; }
        public void setAverageTimeSeconds(double averageTimeSeconds) { this.averageTimeSeconds = averageTimeSeconds; }

        public String getPedagogicalDiagnosis() { return pedagogicalDiagnosis; }
        public void setPedagogicalDiagnosis(String pedagogicalDiagnosis) { this.pedagogicalDiagnosis = pedagogicalDiagnosis; }

        public String getTopMistakeOptionText() { return topMistakeOptionText; }
        public void setTopMistakeOptionText(String topMistakeOptionText) { this.topMistakeOptionText = topMistakeOptionText; }

        public double getTopMistakePercentage() { return topMistakePercentage; }
        public void setTopMistakePercentage(double topMistakePercentage) { this.topMistakePercentage = topMistakePercentage; }

        public List<OptionStatDTO> getOptions() { return options; }
        public void setOptions(List<OptionStatDTO> options) { this.options = options; }
    }

    public static class OptionStatDTO {
        private Long optionId;
        private String text;
        private boolean correct;
        private int count;
        private double percentage;

        public OptionStatDTO() {}

        public OptionStatDTO(Long optionId, String text, boolean correct, int count, double percentage) {
            this.optionId = optionId;
            this.text = text;
            this.correct = correct;
            this.count = count;
            this.percentage = percentage;
        }

        public Long getOptionId() { return optionId; }
        public void setOptionId(Long optionId) { this.optionId = optionId; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public boolean isCorrect() { return correct; }
        public void setCorrect(boolean correct) { this.correct = correct; }

        public int getCount() { return count; }
        public void setCount(int count) { this.count = count; }

        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
    }
}
