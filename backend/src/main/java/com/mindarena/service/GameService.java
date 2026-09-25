package com.mindarena.service;

import com.mindarena.model.*;
import com.mindarena.repository.*;
import com.mindarena.dto.GameEventDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;
import java.util.List;

@Service
public class GameService {
    
    private final GameSessionRepository gameRepo;
    private final QuizRepository quizRepo;
    private final PlayerRepository playerRepo;
    private final PlayerAnswerRepository answerRepo;
    private final SimpMessagingTemplate messagingTemplate;

    public GameService(GameSessionRepository gameRepo, QuizRepository quizRepo, 
                       PlayerRepository playerRepo, PlayerAnswerRepository answerRepo,
                       SimpMessagingTemplate messagingTemplate) {
        this.gameRepo = gameRepo;
        this.quizRepo = quizRepo;
        this.playerRepo = playerRepo;
        this.answerRepo = answerRepo;
        this.messagingTemplate = messagingTemplate;
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
        if (playerRepo.existsByGameSessionIdAndNickname(session.getId(), nickname)) {
            throw new RuntimeException("Apelido já em uso nesta partida.");
        }
        
        Player player = new Player();
        player.setNickname(nickname);
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

    @Transactional
    public void endQuestion(String code) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.QUESTION_ACTIVE) {
            return;
        }
        session.setStatus(GameStatus.QUESTION_ENDED);
        gameRepo.save(session);
        
        List<Player> leaderboard = playerRepo.findByGameSessionIdOrderByScoreDesc(session.getId());
        broadcastEvent(code, "QUESTION_ENDED", leaderboard);
    }

    @Transactional
    public java.util.Map<String, Object> submitAnswer(String code, Long playerId, Long optionId, int timeTakenMs) {
        GameSession session = getGameByCode(code);
        if (session.getStatus() != GameStatus.QUESTION_ACTIVE) {
            throw new RuntimeException("A pergunta não está ativa.");
        }
        
        Question q = session.getQuiz().getQuestions().get(session.getCurrentQuestionIndex());
        if (answerRepo.existsByPlayerIdAndQuestionId(playerId, q.getId())) {
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
            if (timeTakenMs < 0) timeTakenMs = 0;
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

    private void broadcastEvent(String code, String type, Object payload) {
        GameEventDTO event = new GameEventDTO(type, payload);
        messagingTemplate.convertAndSend("/topic/game/" + code, event);
    }
}
