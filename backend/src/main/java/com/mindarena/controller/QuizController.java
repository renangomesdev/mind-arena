package com.mindarena.controller;

import com.mindarena.model.Quiz;
import com.mindarena.dto.QuizDTO;
import com.mindarena.service.QuizService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    @GetMapping
    public List<Quiz> getAllQuizzes() {
        return quizService.getAllQuizzes();
    }

    @GetMapping("/{id}")
    public Quiz getQuizById(@PathVariable Long id) {
        return quizService.getQuizById(id);
    }

    @PostMapping
    public Quiz createQuiz(@RequestBody QuizDTO quizDTO) {
        return quizService.createQuiz(quizDTO);
    }
}
