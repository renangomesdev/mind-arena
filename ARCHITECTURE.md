# Arquitetura do Mind Arena

O **Mind Arena** foi arquitetado seguindo o modelo de *Single Page Application (SPA)* comunicando-se com uma API Restful e WebSockets para tempo real.

## Diagrama Lógico

```text
+-------------------+       REST / WebSocket       +---------------------+
|                   |  <------------------------>  |                     |
|  Frontend (React) |                              | Backend (Spring)    |
|                   |                              |                     |
+-------------------+                              +---------------------+
          |                                                   |
          | Renderiza UI e gerencia                           | Gerencia estado central da partida
          | estado local (Vite/TS)                            | JPA / Hibernate
          |                                                   |
                                                     +---------------------+
                                                     |                     |
                                                     | PostgreSQL (DB)     |
                                                     |                     |
                                                     +---------------------+
```

## 1. Frontend
- **React + Vite:** Escolhido por ser rápido, focado em performance de build e possuir ecossistema rico.
- **Tailwind CSS:** Para estilização rápida e responsiva sem a necessidade de criar grandes arquivos CSS separados.
- **Axios & @stomp/stompjs:** Para chamadas HTTP padrão (criar quiz) e conexões WebSockets persistentes (sincronização do jogo).

## 2. Backend
- **Spring Boot 3 + Java 17:** Framework robusto e padrão de mercado. Ideal para expor APIs REST rapidamente.
- **WebSocket com STOMP:** Utilizado o MessageBroker nativo do Spring. A escolha do STOMP permite trabalhar com tópicos pub/sub sem a complexidade de brokers externos (como RabbitMQ) para este MVP.
- **State Machine Embutida:** A partida transita pelos estados: `WAITING -> STARTING -> QUESTION_ACTIVE -> QUESTION_ENDED -> FINISHED`. O Backend é a única fonte de verdade.

## 3. Persistência
- **PostgreSQL:** Banco de dados relacional. Perfeito para garantir integridade e transacionabilidade nas respostas e pontuações do Quiz.

## 4. Segurança Mínima e Escopo
- Não utilizamos JWT ou Spring Security neste MVP para facilitar o uso (entrar com apelido apenas).
- Toda a validação de respostas e controle de tempo ocorre de forma híbrida (O Backend define o score, não confia na pontuação enviada pelo cliente).
