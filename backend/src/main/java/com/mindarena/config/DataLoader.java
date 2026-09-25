package com.mindarena.config;

import com.mindarena.model.Quiz;
import com.mindarena.model.Question;
import com.mindarena.model.AnswerOption;
import com.mindarena.repository.QuizRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initDatabase(QuizRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Quiz quiz = new Quiz("Desafio de Tecnologia", "Teste seus conhecimentos em Engenharia de Software e TI.");
                
                Question q1 = new Question();
                q1.setText("Qual linguagem é nativamente utilizada no Spring Boot?");
                q1.setHint("Linguagem baseada em JVM com nome de café");
                q1.setTimeLimitSeconds(15);
                q1.setOrderIndex(1);
                q1.addOption(new AnswerOption("Python", false));
                q1.addOption(new AnswerOption("Java", true));
                q1.addOption(new AnswerOption("C++", false));
                q1.addOption(new AnswerOption("Ruby", false));
                
                Question q2 = new Question();
                q2.setText("O que significa a sigla MVP no contexto de Startups?");
                q2.setHint("Versão mais enxuta para validar a ideia no mercado");
                q2.setTimeLimitSeconds(15);
                q2.setOrderIndex(2);
                q2.addOption(new AnswerOption("Minimum Viable Product", true));
                q2.addOption(new AnswerOption("Most Valuable Player", false));
                q2.addOption(new AnswerOption("Maximum Value Process", false));
                q2.addOption(new AnswerOption("Major Virtual Project", false));

                quiz.addQuestion(q1);
                quiz.addQuestion(q2);
                
                repository.save(quiz);
                System.out.println("Quiz de demonstração criado com sucesso.");
            }
        };
    }
}
