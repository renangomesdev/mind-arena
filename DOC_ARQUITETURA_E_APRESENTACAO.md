# 🏛️ Mind Arena — Documento de Arquitetura, Tecnologias e Apresentação

> **Finalidade deste documento:** Este material técnico detalha a proposta, a arquitetura de software, as tecnologias adotadas com suas respectivas justificativas, os padrões de projeto aplicados e o fluxo de funcionamento do **Mind Arena**. Ele foi estruturado para ser utilizado como base direta na geração de discursos, roteiros de slides e defesas técnicas perante a banca avaliadora da disciplina de Engenharia de Software.

---

## 1. Visão Geral do Projeto

### 1.1. O que é o Mind Arena?
O **Mind Arena** é uma plataforma web gamificada de quiz em tempo real voltada para ambientes acadêmicos e corporativos. Inspirada na atmosfera épica do **Coliseu e dos gladiadores de Roma Antiga**, a aplicação transforma revisões de conteúdo e avaliações formativas em um combate intelectual de reflexos e conhecimento.

* **Slogan:** *"Desafie sua mente. Domine a arena."*
* **Público-alvo:** Professores/Apresentadores (que atuam como Mestres da Arena / Hosts) e Alunos/Participantes (que batalham como Gladiadores através de seus smartphones ou notebooks).

### 1.2. O Problema que Resolve
* **Desengajamento em sala de aula:** Aulas expositivas tradicionais frequentemente sofrem com a dispersão dos alunos e baixa retenção de conteúdo.
* **Falta de feedback pedagógico instantâneo:** Provas tradicionais demoram dias para serem corrigidas, impedindo que o professor identifique dúvidas no momento exato em que são lecionadas.
* **Dependência de ferramentas pagas ou limitadas:** Plataformas existentes (como Kahoot ou Mentimeter) impõem limites rígidos de participantes gratuitos, planos caros e pouca flexibilidade de mecânicas competitivas personalizadas.

### 1.3. O Diferencial Competitivo do Mind Arena
Além da dinâmica clássica de perguntas e respostas com pontuação por tempo e streak, o Mind Arena introduz:
1. **Poderes de Gladiador Interativos:** Os participantes podem utilizar habilidades estratégicas (como *Cegar Oponente com Tempestade de Areia* ou *Consultar Dica da Sabedoria*).
2. **Análise Pedagógica Imediata (Estilo Kahoot):** Ao encerrar cada questão, um gráfico de barras dinâmico decompõe as respostas dos alunos, permitindo debate imediato.
3. **Imersão Temática Romana:** Avatares de elmos antigos, títulos imperiais honorários no pódio e efeitos sonoros gerados por síntese de áudio nativa no navegador.

---

## 2. Fluxo de Funcionamento de Ponta a Ponta

A jornada do sistema é dividida em dois papéis fundamentais: **O Mestre da Arena (Host)** e **Os Gladiadores (Players)**.

```
[ Professor / Host ]                                    [ Alunos / Players ]
        │                                                        │
        ├─► Cria ou escolhe Quiz (ex: Scrum, Algoritmos)         │
        ├─► Abre o Lobby da Arena                                │
        │   └─► Exibe Código da Sala + QR Code Gigante           │
        │                                                        ├─► Aponta câmera pro QR Code
        │                                                        ├─► Escolhe Apelido + Elmo Gladiador
        │                                                        └─► Entra no Lobby instantaneamente
        ├─► [INICIAR ARENA] ────────────────────────────────────► Contagem Regressiva (3, 2, 1)
        │
        ▼
   [ Rodada Ativa ]
        ├─► Cronômetro decrescente com áudio de tensão
        ├─► Alunos respondem em seus celulares (🔺 🔷 ⭐ 🟢)
        ├─► Poderes disponíveis: Cegar Oponente (2s) / Revelar Dica
        │
        ▼
   [ Fim da Pergunta ]
        ├─► Tela do Host: Gráfico de Barras com contagem de respostas por alternativa
        ├─► Destaque visual da resposta CORRETA (✓) vs INCORRETAS (✗)
        ├─► Aluno: Feedback imediato (Acertou / Errou + Pontos + Multiplicador de Streak)
        ├─► Aba do Host: Ranking parcial atualizado
        │
        ▼
   [ Pódio Final ]
        ├─► Escadinha do Pódio em 3D: 1º (Mais alto), 2º e 3º colocados
        ├─► Condecoração com Títulos Romanos Honorários:
        │   • 1º: Imperador da Arena (Magnus Triumphator)
        │   • 2º: Centurião Lendário (Invictus Bellator)
        │   • 3º: Gladiador de Elite (Primus Palus)
        │   • 4º+: Combatente Valente (Legionarius Arenae)
        └─► Aluno vê em seu celular seu card de honra personalizado
```

---

## 3. Arquitetura do Sistema

O Mind Arena adota o padrão **Client-Server com Desacoplamento Total entre Frontend e Backend**, operando com arquitetura orientada a eventos em tempo real.

### 3.1. Diagrama em Camadas
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (FRONTEND)                  │
│                                                             │
│   React 19 + TypeScript + Vite + Tailwind CSS              │
│   • Tela do Host (Lobby, Questão, Gráfico Kahoot, Pódio)   │
│   • Tela do Aluno (Seleção de Elmo, Controle, Areia 2s)    │
│   • STOMP Client (WebSockets bidirecional)                  │
│   • Web Audio API Synthesizer (Áudio nativo sem arquivos)  │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP REST                     │ WebSockets
               │ (POST/GET)                    │ (STOMP Pub/Sub)
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                   SERVER LAYER (BACKEND)                    │
│                                                             │
│   Java 21 + Spring Boot 4.x                                 │
│   • Controllers REST (/api/quizzes, /api/games)             │
│   • Service Layer (Regras de negócio, pontuação, poderes)   │
│   • WebSocket Message Broker (STOMP over SockJS)            │
│   • Spring Data JPA / Hibernate (ORM)                       │
└──────────────────────────────┬──────────────────────────────┘
                               │ JDBC (Pool HikariCP)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER (DATABASE)                   │
│                                                             │
│   PostgreSQL 15 (Containerizado via Docker)                 │
│   • Tabelas: Quiz, Question, AnswerOption,                  │
│              GameSession, Player, PlayerAnswer              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Padrões de Comunicação Híbrida: REST vs WebSockets
* **HTTP / REST:** Utilizado para operações transacionais discretas que requerem resposta sob demanda (CRUD de quizzes, criação inicial da sessão, requisição de estatísticas e listagem).
* **WebSockets com STOMP (Simple Text Oriented Messaging Protocol):** Utilizado para o ciclo de vida da partida em tempo real. Cada partida possui um canal exclusivo (`/topic/game/{codigo}`).
  * **Vantagem:** Elimina o *HTTP Polling* (onde centenas de clientes sobrecarregariam o servidor perguntando a cada segundo "o jogo começou?"). Com o WebSocket, o servidor **empurra (push)** o evento aos clientes em menos de 5 milissegundos.

---

## 4. Tecnologias Utilizadas e Justificativa Técnica

Para a banca de Engenharia de Software, a escolha de cada componente técnico deve ser fundamentada em critérios de desempenho, escalabilidade, manutenibilidade e experiência do desenvolvedor:

### 4.1. Backend

| Tecnologia | Função no Projeto | Motivo / Justificativa Técnica |
| :--- | :--- | :--- |
| **Java 21** | Linguagem principal do backend | Versão LTS (Long-Term Support) com performance de ponta, forte tipagem estática que previne erros em tempo de compilação, threads virtuais e robustez corporativa consolidada. |
| **Spring Boot 4.x** | Framework da aplicação | Fornece uma arquitetura em camadas padrão da indústria (Controller-Service-Repository), injeção de dependência e gerenciamento nativo de WebSockets sem configurações manuais complexas. |
| **Spring WebSocket + STOMP** | Mensageria em tempo real | Implementa o padrão Publish-Subscribe nativo com um *Simple In-Memory Broker*. Permite que clientes se inscrevam em canais e recebam transmissões simultâneas de eventos sem sobrecarga de rede. |
| **Spring Data JPA + Hibernate** | Mapeamento Objeto-Relacional (ORM) | Abstrai comandos SQL brutos em interfaces tipadas (`QuizRepository`, `PlayerAnswerRepository`), reduzindo código repetitivo e garantindo integridade referencial com migração automática de schema (`ddl-auto: update`). |
| **PostgreSQL 15** | Banco de dados relacional | Banco ACID com suporte avançado a chaves estrangeiras, índices e integridade relacional. Essencial para garantir que respostas, jogadores e pontuações nunca sejam corrompidos em cenários de concorrência. |
| **Docker & Docker Compose** | Containerização do banco | Garante reproducibilidade do ambiente. Qualquer membro da equipe ou avaliador pode subir o banco de dados idêntico em segundos com `docker compose up -d`, sem precisar instalar o PostgreSQL localmente. |

### 4.2. Frontend

| Tecnologia | Função no Projeto | Motivo / Justificativa Técnica |
| :--- | :--- | :--- |
| **React 19** | Biblioteca de interface | Modelo baseado em componentes reativos. A Virtual DOM permite atualizar instantaneamente elementos de alta frequência (cronômetro descendo, contador de respostas ao vivo, gráfico subindo) sem travar a interface. |
| **TypeScript** | Superset tipado do JavaScript | Impõe tipagem estática rigorosa para payloads de WebSocket, DTOs e entidades. Reduz a zero erros de execução por propriedades indefinidas (`undefined is not a function`). |
| **Vite** | Bundler e Servidor de Desenvolvimento | Compilação ultrarrápida baseada em ES Modules nativos com Hot Module Replacement (HMR) sub-segundo, garantindo alta velocidade de desenvolvimento e build leve para produção. |
| **Tailwind CSS** | Framework de estilização utilitária | Permite estilização direta e responsiva sem arquivos CSS desconexos. Viabilizou a criação do tema clássico romano (gradientes dourados, cards translúcidos, animações de tremor e tempestade de areia). |
| **@stomp/stompjs** | Cliente WebSocket no navegador | Biblioteca cliente padrão do STOMP, gerenciando reconexão automática, subscrição em tópicos e serialização/desserialização de mensagens JSON. |
| **Web Audio API** | Sistema de áudio sintetizado nativo | **Decisão de alto impacto:** Em vez de carregar arquivos MP3 pesados (que causam lentidão e falhas de CORS/rede), os efeitos de som (ticks, fanfarras, acerto, erro, tempestade de areia) são **sintetizados diretamente pela placa de som** via código oscilador JavaScript (`AudioContext`), com latência zero e consumo mínimo de memória. |
| **qrcode.react (SVG)** | Gerador de QR Code vetorial | Gera dinamicamente o QR Code na tela do professor contendo a URL de entrada com o código pré-preenchido, permitindo que os alunos entrem na hora apenas apontando a câmera do celular. |
| **Lucide React** | Conjunto de ícones vetoriais | Fornece ícones semânticos leves (espadas, coroas, escudos, gráficos, troféus) que complementam a estética da arena sem aumentar o payload da aplicação. |

---

## 5. Decisões de Engenharia de Software e Padrões de Projeto

Para destacar a excelência técnica na apresentação, ressalte os padrões de projeto (Design Patterns) e práticas de arquitetura aplicadas:

### 5.1. Padrão Observer / Publish-Subscribe (Pub/Sub)
* O servidor atua como o Publicador (*Publisher*) de eventos da partida (`QUESTION_STARTED`, `ANSWER_SUBMITTED`, `QUESTION_ENDED`, `PLAYER_BLINDED`).
* Todos os clientes conectados (Host e Jogadores) atuam como Observadores (*Subscribers*) do canal da partida. Quando o professor clica em avançar, uma única mensagem no broker notifica dezenas de navegadores instantaneamente.

### 5.2. Máquina de Estados Finita (State Machine)
Tanto o backend quanto o frontend operam sob uma máquina de estados rigorosa:
$$\text{WAITING} \longrightarrow \text{STARTING} \longrightarrow \text{QUESTION\_ACTIVE} \longrightarrow \text{QUESTION\_ENDED} \longrightarrow \text{FINISHED}$$
* Previne trapaças e estados inválidos: um jogador não consegue enviar respostas se o estado da sessão não for estritamente `QUESTION_ACTIVE`.

### 5.3. Algoritmo de Pontuação Dinâmica por Velocidade e Streak
A pontuação não é estática; ela premia quem responde mais rápido e com consistência:
$$\text{Pontos Base} = 500 + \left\lfloor 500 \times \left(1 - \frac{\text{Tempo Gasto}}{\text{Tempo Limite}}\right) \right\rfloor$$
$$\text{Bônus de Streak} = \min\big((\text{Acertos Consecutivos} - 1) \times 200,\; 1000\big)$$
* Respostas corretas imediatas rendem até **1000 pontos base** mais bônus cumulativo de até **1000 pontos de combo**, totalizando até 2000 pontos em uma única pergunta.

### 5.4. Programação Defensiva e Sincronização em Tempo Real
* **Tratamento de Entrada Tardia de Jogadores:** Quando um aluno entra na sala enquanto outros já estavam conectados, o evento `PLAYER_JOINED` e a função de recarregamento dinâmico sincronizam a lista de oponentes para que todos possam usar os poderes entre si, sem estados inconsistentes.
* **Isolamento de IDs numéricos e strings:** Conversão defensiva de identificadores (`Number(id)`) tanto no payload JSON do Jackson quanto no JavaScript para evitar falhas de tipagem dinâmica.
* **Controle de Timer com Limpeza de Intervalos:** Timers de tela (como os 2 segundos do poder de cegar) são controlados via referências (`useRef`) com `clearInterval` defensivo, impedindo vazamentos de memória e sobreposições de animação.

---

## 6. Roteiro Sugerido para Apresentação Oral (Pitch para a Banca)

Caso vá alimentar outra IA para gerar o roteiro da sua fala, aqui está o esqueleto temático ideal:

### Bloco 1: Abertura e Motivação (1 a 2 minutos)
* Cumprimentar a banca e o professor.
* Apresentar o problema: o desafio de engajar turmas e avaliar conhecimento de forma dinâmica.
* Apresentar o Mind Arena: a fusão da gamificação moderna com a atmosfera épica dos gladiadores romanos.

### Bloco 2: Arquitetura e Engenharia (3 a 4 minutos)
* Destacar o desacoplamento do sistema: Backend em Java 21 com Spring Boot e Frontend em React 19 com Vite.
* Explicar o porquê do **WebSocket / STOMP**: por que escolhemos mensageria orientada a eventos em tempo real em vez de requisições HTTP tradicionais.
* Explicar o papel do **PostgreSQL no Docker**: persistência segura, integridade referencial com ACID e facilidade de implantação em equipe.
* Citar a **Web Audio API**: como geramos áudio nativo sintetizado pelo navegador com zero latência e sem carregar arquivos pesados.

### Bloco 3: Demonstração Prática / Live Demo (3 a 5 minutos)
1. **Lobby:** Mostrar a tela do professor com o QR Code dinâmico e os alunos entrando pelo celular escolhendo seus elmos de gladiador.
2. **Rodada ao Vivo:** Iniciar a partida, mostrar a contagem regressiva e os alunos respondendo.
3. **Poder da Arena em Ação:** Mostrar um aluno usando o poder de **Cegar** e a tela do oponente tremendo com a tempestade de areia e o bloqueio de 2 segundos.
4. **Gráfico Pedagógico Kahoot:** Mostrar o fim da pergunta com o gráfico de barras exibindo a porcentagem de acertos da turma.
5. **Pódio Imperial:** Concluir a partida exibindo os vencedores no pódio com os **Títulos Romanos Honorários** (*Imperador da Arena*, *Centurião*, *Gladiador*).

### Bloco 4: Conclusão (1 minuto)
* Destacar a escalabilidade do sistema (pronto para ser hospedado em nuvem).
* Mencionar o impacto pedagógico: o professor ganha métricas em tempo real e os alunos aprendem competindo de forma divertida.
* Agradecer à banca e abrir para perguntas.
