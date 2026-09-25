# Mind Arena 🧠🏆

**"Desafie sua mente. Domine a arena."**

Mind Arena é uma plataforma interativa de quizzes em tempo real (inspirada no Kahoot!), desenvolvida como projeto universitário MVP. O foco principal está na experiência de uso fluida, visual atraente e arquitetura moderna.

## 🚀 Tecnologias

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, StompJS
- **Backend:** Java 17, Spring Boot, Spring Data JPA, WebSockets (STOMP)
- **Banco de Dados:** PostgreSQL 15
- **Infraestrutura:** Docker e Docker Compose

## 📁 Estrutura de Diretórios
- `/backend`: Aplicação Spring Boot, lógica da partida e API.
- `/frontend`: SPA React.

## ⚙️ Como Executar Localmente

Você precisará do **Docker** e **Docker Compose** instalados, ou rodar o Node e o Maven/Java manualmente.

### Opção 1: Usando Docker (Recomendado)

Na raiz do projeto (`/mind-arena`):

1. Suba o banco de dados PostgreSQL:
   ```bash
   docker-compose up -d
   ```

2. (Opcional) Se quiser rodar a stack completa via docker-compose (Frontend + Backend), você pode adicionar as imagens ao `docker-compose.yml`. Mas para desenvolvimento interativo, recomendamos subir o banco no Docker e as aplicações nativamente.

### Opção 2: Desenvolvimento Local Interativo

1. **Suba o Banco de Dados (Docker):**
   ```bash
   docker-compose up -d
   ```

2. **Inicie o Backend (Spring Boot):**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *O backend rodará na porta `8080`. Um Quiz de demonstração será criado automaticamente na inicialização.*

3. **Inicie o Frontend (Vite/React):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *O frontend rodará em `http://localhost:5173`.*

## 🎮 Fluxo de uma Partida (Demonstração)

1. Acesse `http://localhost:5173`.
2. Como **Professor**, clique em "Host" no Quiz de Demonstração ou crie um novo quiz clicando em "Criar Quiz".
3. A tela de **Lobby** do professor será aberta exibindo um **CÓDIGO** (ex: `A7K9P2`).
4. Como **Aluno** (abra outra aba do navegador ou celular), acesse a página inicial e digite o Código e um Apelido.
5. O nome do aluno aparecerá magicamente no Lobby do Professor em tempo real.
6. O Professor clica em "Iniciar Arena".
7. A contagem regressiva começa, seguida pela pergunta!
8. Os alunos respondem pelo celular, recebem pontuações e o sistema calcula o pódio final automaticamente.

## 🌍 Variáveis de Ambiente

Renomeie o `.env.example` para `.env` se for realizar Deploy (por exemplo, na Railway ou Heroku).
- `DATABASE_URL` (padrão: `jdbc:postgresql://localhost:5432/mindarena`)
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `VITE_BACKEND_URL` (para o Frontend React acessar o backend na nuvem)
- `VITE_WS_URL` (para a conexão de WebSocket, ex: `wss://sua-api.com/ws`)

Leia o arquivo `ARCHITECTURE.md` para entender as decisões de design.
