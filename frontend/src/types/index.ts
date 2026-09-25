
export interface Quiz {
    id?: number;
    title: string;
    description: string;
    questions: Question[];
}

export interface Question {
    id?: number;
    text: string;
    hint?: string;
    timeLimitSeconds: number;
    orderIndex: number;
    options: AnswerOption[];
}

export interface AnswerOption {
    id?: number;
    text: string;
    isCorrect: boolean;
}

export interface Player {
    id?: number;
    nickname: string;
    avatar?: string;
    score: number;
    streak?: number;
    usedBlind?: boolean;
    usedHint?: boolean;
}

export interface GameSession {
    id?: number;
    code: string;
    status: string;
    currentQuestionIndex: number;
    powersEnabled?: boolean;
    quiz: Quiz;
    players: Player[];
}
