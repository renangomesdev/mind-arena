package com.mindarena.config;

import com.mindarena.model.Quiz;
import com.mindarena.model.Question;
import com.mindarena.model.AnswerOption;
import com.mindarena.repository.QuizRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner initDatabase(QuizRepository repository) {
        return args -> {
            seedSoftwareEngineeringQuiz(repository);
            seedRomanHistoryQuiz(repository);
            seedAlgorithmsQuiz(repository);
            seedTechnologyQuiz(repository);
        };
    }

    private void seedSoftwareEngineeringQuiz(QuizRepository repository) {
        String title = "Engenharia de Software & Scrum";
        if (repository.existsByTitle(title)) return;

        Quiz quiz = new Quiz(title, "Desafio clássico sobre Scrum, SOLID, Testes de Software e Boas Práticas.");

        Question q1 = createQuestion(
            "No framework Scrum, quem é o principal responsável por priorizar o Product Backlog?",
            "É quem representa a voz do cliente e define o valor do negócio.",
            20, 1,
            List.of(
                new AnswerOption("Scrum Master", false),
                new AnswerOption("Product Owner", true),
                new AnswerOption("Tech Lead", false),
                new AnswerOption("Time de Desenvolvimento", false)
            )
        );

        Question q2 = createQuestion(
            "O que significa a letra 'S' no conjunto de princípios SOLID da Programação Orientada a Objetos?",
            "Cada classe deve ter apenas um motivo para mudar.",
            20, 2,
            List.of(
                new AnswerOption("Single Responsibility Principle", true),
                new AnswerOption("Static Optimization Logic", false),
                new AnswerOption("Sequential Object Pattern", false),
                new AnswerOption("Structured Operation Interface", false)
            )
        );

        Question q3 = createQuestion(
            "Em testes de software, qual tipo de teste valida o funcionamento isolado da menor parte testável de código?",
            "Testa funções e classes individualmente, geralmente usando mocks.",
            20, 3,
            List.of(
                new AnswerOption("Teste de Carga", false),
                new AnswerOption("Teste de Integração", false),
                new AnswerOption("Teste Unitário", true),
                new AnswerOption("Teste de Aceitação", false)
            )
        );

        Question q4 = createQuestion(
            "No controle de versão com Git, qual comando é usado para trazer alterações remotas e mesclá-las no branch atual?",
            "Combina as ações de 'fetch' e 'merge'.",
            20, 4,
            List.of(
                new AnswerOption("git commit", false),
                new AnswerOption("git push", false),
                new AnswerOption("git pull", true),
                new AnswerOption("git clone", false)
            )
        );

        Question q5 = createQuestion(
            "Qual padrão arquitetural separa a aplicação em Modelo de Dados, Interface de Usuário e Controle de Fluxo?",
            "Padrão clássico em 3 camadas muito popular em desenvolvimento web.",
            20, 5,
            List.of(
                new AnswerOption("Singleton Pattern", false),
                new AnswerOption("Microservices Architecture", false),
                new AnswerOption("MVC (Model-View-Controller)", true),
                new AnswerOption("Pipeline Architecture", false)
            )
        );

        quiz.addQuestion(q1);
        quiz.addQuestion(q2);
        quiz.addQuestion(q3);
        quiz.addQuestion(q4);
        quiz.addQuestion(q5);

        repository.save(quiz);
        System.out.println("Quiz '" + title + "' criado com sucesso.");
    }

    private void seedRomanHistoryQuiz(QuizRepository repository) {
        String title = "Gladiadores & Roma Antiga";
        if (repository.existsByTitle(title)) return;

        Quiz quiz = new Quiz(title, "Mergulhe na era clássica dos imperadores, legiões romanas e batalhas no Coliseu.");

        Question q1 = createQuestion(
            "Qual é o nome oficial original em latim do Coliseu de Roma?",
            "Construído durante a dinastia dos imperadores Flávios.",
            20, 1,
            List.of(
                new AnswerOption("Circus Maximus", false),
                new AnswerOption("Amphitheatrum Flavium", true),
                new AnswerOption("Pantheon Romanum", false),
                new AnswerOption("Forum Traiani", false)
            )
        );

        Question q2 = createQuestion(
            "Qual era a famosa saudação em latim feita pelos gladiadores ao imperador antes das lutas?",
            "Significa: 'Salve César, os que vão morrer te saúdam'.",
            20, 2,
            List.of(
                new AnswerOption("Veni, Vidi, Vici", false),
                new AnswerOption("Ave, Caesar, morituri te salutant", true),
                new AnswerOption("Alea jacta est", false),
                new AnswerOption("Carpe Diem", false)
            )
        );

        Question q3 = createQuestion(
            "Qual gladiador trácio liderou a mais célebre rebelião de escravos contra a República Romana em 73 a.C.?",
            "O guerreiro que desafiou os generais de Roma saindo de Cápua.",
            20, 3,
            List.of(
                new AnswerOption("Espártaco (Spartacus)", true),
                new AnswerOption("Máximo Décimo Merídio", false),
                new AnswerOption("Crixus da Gália", false),
                new AnswerOption("Marco Licínio Crasso", false)
            )
        );

        Question q4 = createQuestion(
            "Quem foi o primeiro Imperador de Roma, governando no início da era da Pax Romana?",
            "Seu nome original era Otávio (Otaviano).",
            20, 4,
            List.of(
                new AnswerOption("Júlio César", false),
                new AnswerOption("Nero Cláudio", false),
                new AnswerOption("César Augusto", true),
                new AnswerOption("Marco Aurélio", false)
            )
        );

        Question q5 = createQuestion(
            "Qual classe de gladiador lutava de forma ágil armada apenas com um tridente e uma rede?",
            "O nome vem da palavra latina para rede ('rete').",
            20, 5,
            List.of(
                new AnswerOption("Murmillo", false),
                new AnswerOption("Secutor", false),
                new AnswerOption("Retiarius", true),
                new AnswerOption("Thraex", false)
            )
        );

        quiz.addQuestion(q1);
        quiz.addQuestion(q2);
        quiz.addQuestion(q3);
        quiz.addQuestion(q4);
        quiz.addQuestion(q5);

        repository.save(quiz);
        System.out.println("Quiz '" + title + "' criado com sucesso.");
    }

    private void seedAlgorithmsQuiz(QuizRepository repository) {
        String title = "Algoritmos & Estruturas de Dados";
        if (repository.existsByTitle(title)) return;

        Quiz quiz = new Quiz(title, "Desafios de raciocínio lógico, complexidade computacional e estruturas de dados.");

        Question q1 = createQuestion(
            "Qual é a complexidade média de busca em uma Árvore Binária de Busca (BST) balanceada?",
            "A cada comparação, a árvore descarta metade dos nós restantes.",
            20, 1,
            List.of(
                new AnswerOption("O(1)", false),
                new AnswerOption("O(n)", false),
                new AnswerOption("O(log n)", true),
                new AnswerOption("O(n²)", false)
            )
        );

        Question q2 = createQuestion(
            "Qual estrutura de dados opera sob o princípio LIFO (Last In, First Out)?",
            "Pense em uma pilha de pratos: o último adicionado é o primeiro a ser retirado.",
            20, 2,
            List.of(
                new AnswerOption("Fila (Queue)", false),
                new AnswerOption("Pilha (Stack)", true),
                new AnswerOption("Tabela Hash", false),
                new AnswerOption("Grafo Acíclico", false)
            )
        );

        Question q3 = createQuestion(
            "Qual algoritmo clássico de ordenação utiliza a estratégia de divisão e conquista com escolha de pivô?",
            "Algoritmo eficiente inventado pelo cientista da computação Tony Hoare.",
            20, 3,
            List.of(
                new AnswerOption("QuickSort", true),
                new AnswerOption("BubbleSort", false),
                new AnswerOption("InsertionSort", false),
                new AnswerOption("SelectionSort", false)
            )
        );

        Question q4 = createQuestion(
            "O que acontece caso uma função recursiva não possua uma condição de parada (caso base)?",
            "As chamadas sucessivas consomem toda a memória reservada da pilha de execução.",
            20, 4,
            List.of(
                new AnswerOption("O programa executa normalmente", false),
                new AnswerOption("Estouro de Pilha (Stack Overflow)", true),
                new AnswerOption("Bloqueio de Deadlock no banco", false),
                new AnswerOption("A variável é promovida a global", false)
            )
        );

        Question q5 = createQuestion(
            "Qual estrutura de dados oferece inserção e busca em tempo médio O(1) usando função de espalhamento?",
            "Armazena pares chave-valor indexados por hash codes.",
            20, 5,
            List.of(
                new AnswerOption("Lista Encadeada", false),
                new AnswerOption("Árvore Rubro-Negra", false),
                new AnswerOption("Tabela Hash (Hash Map)", true),
                new AnswerOption("Grafo Ponderado", false)
            )
        );

        quiz.addQuestion(q1);
        quiz.addQuestion(q2);
        quiz.addQuestion(q3);
        quiz.addQuestion(q4);
        quiz.addQuestion(q5);

        repository.save(quiz);
        System.out.println("Quiz '" + title + "' criado com sucesso.");
    }

    private void seedTechnologyQuiz(QuizRepository repository) {
        String title = "Desafio de Tecnologia";
        if (repository.existsByTitle(title)) return;

        Quiz quiz = new Quiz(title, "Teste seus conhecimentos em Engenharia de Software e TI.");

        Question q1 = createQuestion(
            "Qual linguagem é nativamente utilizada no Spring Boot?",
            "Linguagem baseada em JVM com nome de café",
            15, 1,
            List.of(
                new AnswerOption("Python", false),
                new AnswerOption("Java", true),
                new AnswerOption("C++", false),
                new AnswerOption("Ruby", false)
            )
        );

        Question q2 = createQuestion(
            "O que significa a sigla MVP no contexto de Startups?",
            "Versão mais enxuta para validar a ideia no mercado",
            15, 2,
            List.of(
                new AnswerOption("Minimum Viable Product", true),
                new AnswerOption("Most Valuable Player", false),
                new AnswerOption("Maximum Value Process", false),
                new AnswerOption("Major Virtual Project", false)
            )
        );

        quiz.addQuestion(q1);
        quiz.addQuestion(q2);

        repository.save(quiz);
        System.out.println("Quiz '" + title + "' criado com sucesso.");
    }

    private Question createQuestion(String text, String hint, int timeLimit, int orderIndex, List<AnswerOption> options) {
        Question q = new Question();
        q.setText(text);
        q.setHint(hint);
        q.setTimeLimitSeconds(timeLimit);
        q.setOrderIndex(orderIndex);
        for (AnswerOption opt : options) {
            q.addOption(opt);
        }
        return q;
    }
}
