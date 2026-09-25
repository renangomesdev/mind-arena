package com.mindarena.service;

import com.mindarena.model.Quiz;
import com.mindarena.model.Question;
import com.mindarena.model.AnswerOption;
import com.mindarena.dto.QuizDTO;
import com.mindarena.dto.QuestionDTO;
import com.mindarena.dto.AnswerOptionDTO;
import com.mindarena.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {
    
    private final QuizRepository quizRepository;

    public QuizService(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    public List<Quiz> getAllQuizzes() {
        return quizRepository.findAll();
    }

    public Quiz getQuizById(Long id) {
        return quizRepository.findById(id).orElseThrow(() -> new RuntimeException("Quiz not found"));
    }

    @Transactional
    public Quiz createQuiz(QuizDTO dto) {
        Quiz quiz = new Quiz(dto.getTitle(), dto.getDescription());
        
        if (dto.getQuestions() != null) {
            for (QuestionDTO qDto : dto.getQuestions()) {
                Question q = new Question();
                q.setText(qDto.getText());
                q.setHint(qDto.getHint());
                q.setTimeLimitSeconds(qDto.getTimeLimitSeconds());
                q.setOrderIndex(qDto.getOrderIndex());
                
                if (qDto.getOptions() != null) {
                    for (AnswerOptionDTO oDto : qDto.getOptions()) {
                        q.addOption(new AnswerOption(oDto.getText(), oDto.getIsCorrect()));
                    }
                }
                quiz.addQuestion(q);
            }
        }
        
        return quizRepository.save(quiz);
    }
}
