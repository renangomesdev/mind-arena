package com.mindarena.service;

import com.mindarena.model.*;
import com.mindarena.repository.*;
import com.mindarena.dto.GameEventDTO;
import com.mindarena.dto.PedagogicalReportDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;
import java.util.List;
import java.util.ArrayList;

@Service
public class GameService {
    
    private final GameSessionRepository gameRepo;
    private final QuizRepository quizRepo;
    private final PlayerRepository playerRepo;
    private final PlayerAnswerRepository answerRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecurityAuditService auditService;

    public GameService(GameSessionRepository gameRepo, QuizRepository quizRepo, 
                       PlayerRepository playerRepo, PlayerAnswerRepository answerRepo,
                       SimpMessagingTemplate messagingTemplate, SecurityAuditService auditService) {
        this.gameRepo = gameRepo;
        this.quizRepo = quizRepo;
        this.playerRepo = playerRepo;
        this.answerRepo = answerRepo;
        this.messagingTemplate = messagingTemplate;
        this.auditService = auditService;
    }

    private String generateCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        Random rnd = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Transactional
    public GameSession createGame(Long quizId) {
        return createGame(quizId, false);
    }

    @Transactional
    public GameSession createGame(Long quizId, boolean powersEnabled) {
        Quiz quiz = quizRepo.findById(quizId).orElseThrow(() -> new RuntimeException("Quiz not found"));
        if (powersEnabled) {
            boolean allHaveHints = quiz.getQuestions().stream()
                .allMatch(q -> q.getHint() != null && !q.getHint().trim().isEmpty());
            if (!allHaveHints) {
                throw new RuntimeException("Todas as perguntas precisam ter dicas para ativar os poderes!");
            }
        }
        GameSession session = new GameSession();
        session.setQuiz(quiz);
        session.setCode(generateCode());
        session.setStatus(GameStatus.WAITING);
        session.setPowersEnabled(powersEnabled);
        return gameRepo.save(session);
    }

    public GameSession getGameByCode(String code) {
        return gameRepo.findByCode(code).orElseThrow(() -> new RuntimeException("Game not found"));
    }

    @Transactional
    public Player joinGame(String code, String nickname) {
        return joinGame(code, nickname, "⚔️");
    }

    @Transactional
    public Player joinGame(String code, String nickname, String avatar) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.WAITING) {
            throw new RuntimeException("Não é possível entrar nesta partida. Estado atual: " + session.getStatus());
        }
        if (nickname == null || nickname.trim().isEmpty()) {
            throw new RuntimeException("Apelido não pode ser vazio.");
        }
        String cleanNickname = nickname.trim();
        if (cleanNickname.length() > 30) {
            throw new RuntimeException("Apelido deve ter no máximo 30 caracteres.");
        }
        if (session.getPlayers() != null && session.getPlayers().size() >= 100) {
            throw new RuntimeException("A arena atingiu a capacidade máxima de 100 gladiadores.");
        }
        if (playerRepo.existsByGameSessionIdAndNickname(session.getId(), cleanNickname)) {
            throw new RuntimeException("Apelido já em uso nesta partida.");
        }
        
        Player player = new Player();
        player.setNickname(cleanNickname);
        player.setAvatar(avatar != null && !avatar.isBlank() ? avatar : "⚔️");
        session.addPlayer(player);
        player = playerRepo.save(player);
        
        broadcastEvent(code, "PLAYER_JOINED", player);
        return player;
    }

    @Transactional
    public void startGame(String code) {
        GameSession session = getGameByCode(code);
        session.setStatus(GameStatus.STARTING);
        gameRepo.save(session);
        broadcastEvent(code, "GAME_STARTED", null);
    }

    @Transactional
    public void nextQuestion(String code) {
        GameSession session = getGameByCode(code);
        session.setCurrentQuestionIndex(session.getCurrentQuestionIndex() + 1);
        
        if (session.getCurrentQuestionIndex() >= session.getQuiz().getQuestions().size()) {
            session.setStatus(GameStatus.FINISHED);
            gameRepo.save(session);
            List<Player> leaderboard = playerRepo.findByGameSessionIdOrderByScoreDesc(session.getId());
            broadcastEvent(code, "FINISHED", leaderboard);
            return;
        }
        
        session.setStatus(GameStatus.QUESTION_ACTIVE);
        gameRepo.save(session);
        
        Question q = session.getQuiz().getQuestions().get(session.getCurrentQuestionIndex());
        broadcastEvent(code, "QUESTION_STARTED", q);
    }

    public java.util.Map<String, Object> getQuestionStats(String code) {
        GameSession session = getGameByCode(code);
        if (session.getCurrentQuestionIndex() < 0 || session.getCurrentQuestionIndex() >= session.getQuiz().getQuestions().size()) {
            return java.util.Map.of();
        }
        Question q = session.getQuiz().getQuestions().get(session.getCurrentQuestionIndex());
        List<PlayerAnswer> answers = answerRepo.findByQuestionIdAndPlayerGameSessionId(q.getId(), session.getId());
        
        int totalAnswers = answers.size();
        int totalPlayers = session.getPlayers() != null ? session.getPlayers().size() : 0;
        
        List<java.util.Map<String, Object>> optionsStats = new java.util.ArrayList<>();
        int correctCount = 0;
        
        for (int i = 0; i < q.getOptions().size(); i++) {
            AnswerOption opt = q.getOptions().get(i);
            long count = answers.stream()
                .filter(a -> a.getAnswerOption() != null && a.getAnswerOption().getId().equals(opt.getId()))
                .count();
            if (opt.isCorrect()) {
                correctCount += (int) count;
            }
            int percentage = totalAnswers > 0 ? (int) Math.round((double) count / totalAnswers * 100) : 0;
            
            optionsStats.add(java.util.Map.of(
                "id", opt.getId(),
                "text", opt.getText(),
                "correct", opt.isCorrect(),
                "count", (int) count,
                "percentage", percentage
            ));
        }
        
        return java.util.Map.of(
            "questionId", q.getId(),
            "questionText", q.getText(),
            "questionIndex", session.getCurrentQuestionIndex(),
            "totalAnswers", totalAnswers,
            "totalPlayers", totalPlayers,
            "correctCount", correctCount,
            "options", optionsStats
        );
    }

    @Transactional
    public void endQuestion(String code) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.QUESTION_ACTIVE) {
            return;
        }
        session.setStatus(GameStatus.QUESTION_ENDED);
        gameRepo.save(session);
        
        List<Player> leaderboard = playerRepo.findByGameSessionIdOrderByScoreDesc(session.getId());
        java.util.Map<String, Object> stats = getQuestionStats(code);
        
        java.util.Map<String, Object> payload = java.util.Map.of(
            "leaderboard", leaderboard,
            "stats", stats
        );
        broadcastEvent(code, "QUESTION_ENDED", payload);
    }

    @Transactional
    public java.util.Map<String, Object> submitAnswer(String code, Long playerId, Long optionId, int timeTakenMs) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.QUESTION_ACTIVE) {
            auditService.recordEvent("PLAYER_" + playerId, "POST", "/api/games/" + code + "/answer",
                "GAME_OUT_OF_TIME_ANSWER", "LOW", "Tentativa de envio de resposta com a pergunta inativa.", "Player: " + playerId, true);
            throw new RuntimeException("A pergunta não está ativa.");
        }
        
        Question q = session.getQuiz().getQuestions().get(session.getCurrentQuestionIndex());
        if (answerRepo.existsByPlayerIdAndQuestionId(playerId, q.getId())) {
            auditService.recordEvent("PLAYER_" + playerId, "POST", "/api/games/" + code + "/answer",
                "GAME_DOUBLE_ANSWER_CHEAT", "MEDIUM", "Tentativa de envio de resposta duplicada para a mesma pergunta (Double-Voting).", "Player: " + playerId, true);
            throw new RuntimeException("Jogador já respondeu esta pergunta.");
        }
        Player player = playerRepo.findById(playerId).orElseThrow();
        AnswerOption selectedOption = q.getOptions().stream()
            .filter(o -> o.getId().equals(optionId))
            .findFirst()
            .orElseThrow();
            
        int points = 0;
        int streakBonus = 0;
        
        if (selectedOption.isCorrect()) {
            player.incrementStreak();
            
            int maxTime = q.getTimeLimitSeconds() * 1000;
            // Validação anti-cheat: tempo mínimo de reação humana plausível (200ms)
            if (timeTakenMs < 200) {
                if (timeTakenMs <= 0) {
                    auditService.recordEvent("PLAYER_" + playerId, "POST", "/api/games/" + code + "/answer",
                        "GAME_INHUMAN_SPEED_CHEAT", "MEDIUM", "Manipulação de payload: timeTakenMs menor ou igual a zero.", "Player: " + playerId, false);
                }
                timeTakenMs = 200;
            }
            if (timeTakenMs > maxTime) timeTakenMs = maxTime;
            double percentage = 1.0 - ((double) timeTakenMs / maxTime);
            if (percentage < 0) percentage = 0;
            int basePoints = 500 + (int)(500 * percentage);
            
            if (player.getStreak() > 1) {
                streakBonus = Math.min((player.getStreak() - 1) * 200, 1000);
            }
            
            points = basePoints + streakBonus;
        } else {
            player.resetStreak();
        }
        
        player.addScore(points);
        playerRepo.save(player);
        
        PlayerAnswer answer = new PlayerAnswer();
        answer.setPlayer(player);
        answer.setQuestion(q);
        answer.setAnswerOption(selectedOption);
        answer.setTimeTakenMs(timeTakenMs);
        answer.setPointsAwarded(points);
        answerRepo.save(answer);
        
        broadcastEvent(code, "ANSWER_SUBMITTED", player.getId());
        
        return java.util.Map.of(
            "correct", selectedOption.isCorrect(),
            "pointsAwarded", points,
            "streakBonus", streakBonus,
            "currentStreak", player.getStreak()
        );
    }

    @Transactional
    public void togglePowers(String code, boolean enable) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.WAITING) {
            throw new RuntimeException("Cannot toggle powers after game has started.");
        }
        
        if (enable) {
            boolean allHaveHints = session.getQuiz().getQuestions().stream()
                .allMatch(q -> q.getHint() != null && !q.getHint().trim().isEmpty());
            if (!allHaveHints) {
                throw new RuntimeException("Todas as perguntas precisam ter dicas para ativar os poderes!");
            }
        }
        
        session.setPowersEnabled(enable);
        gameRepo.save(session);
        broadcastEvent(code, "POWERS_TOGGLED", enable);
    }

    @Transactional
    public void useBlindPower(String code, Long attackerId, Long targetId) {
        GameSession session = getGameByCode(code);
        if (!session.isPowersEnabled()) throw new RuntimeException("Powers are disabled.");
        if (attackerId.equals(targetId)) throw new RuntimeException("Você não pode cegar a si mesmo!");
        
        Player attacker = playerRepo.findById(attackerId).orElseThrow();
        if (attacker.isUsedBlind()) throw new RuntimeException("Already used blind power.");
        
        attacker.setUsedBlind(true);
        playerRepo.save(attacker);
        
        broadcastEvent(code, "PLAYER_BLINDED", targetId);
    }

    @Transactional
    public java.util.Map<String, String> useHintPower(String code, Long playerId) {
        GameSession session = getGameByCode(code);
        if (!session.isPowersEnabled()) throw new RuntimeException("Powers are disabled.");
        
        Player player = playerRepo.findById(playerId).orElseThrow();
        if (player.isUsedHint()) throw new RuntimeException("Already used hint power.");
        
        Question q = session.getQuiz().getQuestions().get(session.getCurrentQuestionIndex());
        
        player.setUsedHint(true);
        playerRepo.save(player);
        
        String hint = (q.getHint() != null && !q.getHint().isBlank()) ? q.getHint() : "Sem dica cadastrada.";
        return java.util.Map.of("hint", hint);
    }

    @Transactional(readOnly = true)
    public PedagogicalReportDTO getPedagogicalReport(String code) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.FINISHED) {
            throw new RuntimeException("Relatório pedagógico disponível apenas após o término da partida.");
        }

        Quiz quiz = session.getQuiz();
        List<Question> questions = quiz.getQuestions() != null ? quiz.getQuestions() : List.of();
        int totalPlayers = session.getPlayers() != null ? session.getPlayers().size() : 0;

        List<PlayerAnswer> allAnswers = answerRepo.findByPlayerGameSessionId(session.getId());
        int totalAnswers = allAnswers.size();

        PedagogicalReportDTO report = new PedagogicalReportDTO();
        report.setGameCode(session.getCode());
        report.setQuizTitle(quiz.getTitle());
        report.setQuizDescription(quiz.getDescription());
        report.setGeneratedAt(java.time.LocalDateTime.now());
        report.setTotalPlayers(totalPlayers);
        report.setTotalQuestions(questions.size());
        report.setTotalAnswers(totalAnswers);

        long overallCorrect = allAnswers.stream()
            .filter(a -> a.getAnswerOption() != null && a.getAnswerOption().isCorrect())
            .count();
        double overallAccuracy = totalAnswers > 0
            ? Math.round(((double) overallCorrect / totalAnswers) * 1000.0) / 10.0
            : 0.0;
        report.setOverallAccuracyPercentage(overallAccuracy);

        double totalTimeSeconds = allAnswers.stream()
            .mapToInt(PlayerAnswer::getTimeTakenMs)
            .sum() / 1000.0;
        double avgTime = totalAnswers > 0
            ? Math.round((totalTimeSeconds / totalAnswers) * 10.0) / 10.0
            : 0.0;
        report.setAverageTimeTakenSeconds(avgTime);

        List<PedagogicalReportDTO.QuestionStatDTO> questionStatsList = new ArrayList<>();
        PedagogicalReportDTO.QuestionStatDTO topMastered = null;
        PedagogicalReportDTO.QuestionStatDTO mostChallenging = null;

        for (Question q : questions) {
            List<PlayerAnswer> qAnswers = allAnswers.stream()
                .filter(a -> a.getQuestion() != null && a.getQuestion().getId().equals(q.getId()))
                .toList();

            int qTotal = qAnswers.size();
            long qCorrect = qAnswers.stream()
                .filter(a -> a.getAnswerOption() != null && a.getAnswerOption().isCorrect())
                .count();

            double qAccuracy = qTotal > 0
                ? Math.round(((double) qCorrect / qTotal) * 1000.0) / 10.0
                : 0.0;

            double qAvgTime = qTotal > 0
                ? Math.round((qAnswers.stream().mapToInt(PlayerAnswer::getTimeTakenMs).average().orElse(0.0) / 100.0)) / 10.0
                : 0.0;

            String diagnosis;
            if (qTotal == 0) {
                diagnosis = "SEM RESPOSTAS";
            } else if (qAccuracy >= 80.0) {
                diagnosis = "CONSOLIDADO";
            } else if (qAccuracy >= 60.0) {
                diagnosis = "BOM";
            } else if (qAccuracy >= 40.0) {
                diagnosis = "PONTO DE ATENÇÃO";
            } else {
                diagnosis = "CRÍTICO";
            }

            // Estatísticas por alternativa
            List<PedagogicalReportDTO.OptionStatDTO> optionStats = new ArrayList<>();
            String topMistakeText = null;
            long maxMistakeCount = 0;

            for (AnswerOption opt : q.getOptions()) {
                long optCount = qAnswers.stream()
                    .filter(a -> a.getAnswerOption() != null && a.getAnswerOption().getId().equals(opt.getId()))
                    .count();
                double optPercent = qTotal > 0
                    ? Math.round(((double) optCount / qTotal) * 1000.0) / 10.0
                    : 0.0;

                optionStats.add(new PedagogicalReportDTO.OptionStatDTO(
                    opt.getId(), opt.getText(), opt.isCorrect(), (int) optCount, optPercent
                ));

                if (!opt.isCorrect() && optCount > maxMistakeCount) {
                    maxMistakeCount = optCount;
                    topMistakeText = opt.getText();
                }
            }

            double topMistakePercent = qTotal > 0 && maxMistakeCount > 0
                ? Math.round(((double) maxMistakeCount / qTotal) * 1000.0) / 10.0
                : 0.0;

            PedagogicalReportDTO.QuestionStatDTO qStat = new PedagogicalReportDTO.QuestionStatDTO();
            qStat.setQuestionId(q.getId());
            qStat.setOrderIndex(q.getOrderIndex() != null ? q.getOrderIndex() : 0);
            qStat.setText(q.getText());
            qStat.setTotalAnswers(qTotal);
            qStat.setCorrectAnswers((int) qCorrect);
            qStat.setAccuracyPercentage(qAccuracy);
            qStat.setAverageTimeSeconds(qAvgTime);
            qStat.setPedagogicalDiagnosis(diagnosis);
            qStat.setTopMistakeOptionText(topMistakeText);
            qStat.setTopMistakePercentage(topMistakePercent);
            qStat.setOptions(optionStats);

            questionStatsList.add(qStat);

            if (qTotal > 0) {
                if (topMastered == null || qAccuracy > topMastered.getAccuracyPercentage()) {
                    topMastered = qStat;
                }
                if (mostChallenging == null || qAccuracy < mostChallenging.getAccuracyPercentage()) {
                    mostChallenging = qStat;
                }
            }
        }

        report.setQuestions(questionStatsList);

        if (topMastered != null) {
            report.setMostMasteredQuestion(new PedagogicalReportDTO.HighlightQuestionDTO(
                topMastered.getQuestionId(), topMastered.getOrderIndex(), topMastered.getText(),
                topMastered.getAccuracyPercentage(), topMastered.getTopMistakeOptionText(), topMastered.getTopMistakePercentage()
            ));
        }

        if (mostChallenging != null) {
            report.setMostChallengingQuestion(new PedagogicalReportDTO.HighlightQuestionDTO(
                mostChallenging.getQuestionId(), mostChallenging.getOrderIndex(), mostChallenging.getText(),
                mostChallenging.getAccuracyPercentage(), mostChallenging.getTopMistakeOptionText(), mostChallenging.getTopMistakePercentage()
            ));
        }

        return report;
    }

    private void broadcastEvent(String code, String type, Object payload) {
        GameEventDTO event = new GameEventDTO(type, payload);
        messagingTemplate.convertAndSend("/topic/game/" + code, event);
    }
}
