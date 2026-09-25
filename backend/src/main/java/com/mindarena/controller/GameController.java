package com.mindarena.controller;

import com.mindarena.model.GameSession;
import com.mindarena.model.Player;
import com.mindarena.service.GameService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/quiz/{quizId}")
    public GameSession createGame(@PathVariable Long quizId, @RequestBody(required = false) Map<String, Object> body) {
        boolean powersEnabled = false;
        if (body != null && body.containsKey("powersEnabled")) {
            powersEnabled = Boolean.parseBoolean(body.get("powersEnabled").toString());
        }
        return gameService.createGame(quizId, powersEnabled);
    }

    @GetMapping("/{code}")
    public GameSession getGame(@PathVariable String code) {
        return gameService.getGameByCode(code);
    }

    @PostMapping("/{code}/players")
    public Player joinGame(@PathVariable String code, @RequestBody Map<String, String> body) {
        return gameService.joinGame(code, body.get("nickname"));
    }

    @PostMapping("/{code}/start")
    public ResponseEntity<?> startGame(@PathVariable String code) {
        gameService.startGame(code);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{code}/next")
    public ResponseEntity<?> nextQuestion(@PathVariable String code) {
        gameService.nextQuestion(code);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{code}/end-question")
    public ResponseEntity<?> endQuestion(@PathVariable String code) {
        gameService.endQuestion(code);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{code}/answer")
    public ResponseEntity<?> submitAnswer(@PathVariable String code, @RequestBody Map<String, Object> body) {
        Long playerId = Long.valueOf(body.get("playerId").toString());
        Long optionId = Long.valueOf(body.get("optionId").toString());
        int timeTakenMs = Integer.parseInt(body.get("timeTakenMs").toString());
        
        var result = gameService.submitAnswer(code, playerId, optionId, timeTakenMs);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{code}/toggle-powers")
    public ResponseEntity<?> togglePowers(@PathVariable String code, @RequestBody Map<String, Boolean> body) {
        gameService.togglePowers(code, body.get("enable"));
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{code}/power/blind")
    public ResponseEntity<?> useBlindPower(@PathVariable String code, @RequestBody Map<String, Long> body) {
        // Need to parse to Long explicitly since JSON might send Integers
        Long attackerId = Long.valueOf(body.get("attackerId").toString());
        Long targetId = Long.valueOf(body.get("targetId").toString());
        gameService.useBlindPower(code, attackerId, targetId);
        return ResponseEntity.ok().build();
    }
    
    @PostMapping("/{code}/power/hint")
    public ResponseEntity<?> useHintPower(@PathVariable String code, @RequestBody Map<String, Long> body) {
        Long playerId = Long.valueOf(body.get("playerId").toString());
        return ResponseEntity.ok(gameService.useHintPower(code, playerId));
    }
}
