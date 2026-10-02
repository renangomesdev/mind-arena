
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
    hasHint?: boolean;
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

export interface OptionStat {
    optionId: number;
    text: string;
    correct: boolean;
    count: number;
    percentage: number;
}

export interface QuestionStat {
    questionId: number;
    orderIndex: number;
    text: string;
    totalAnswers: number;
    correctAnswers: number;
    accuracyPercentage: number;
    averageTimeSeconds: number;
    pedagogicalDiagnosis: string;
    topMistakeOptionText?: string;
    topMistakePercentage?: number;
    options: OptionStat[];
}

export interface HighlightQuestion {
    questionId: number;
    orderIndex: number;
    text: string;
    accuracyPercentage: number;
    topMistakeOptionText?: string;
    topMistakePercentage?: number;
}

export interface PedagogicalReport {
    gameCode: string;
    quizTitle: string;
    quizDescription: string;
    generatedAt: string;
    totalPlayers: number;
    totalQuestions: number;
    totalAnswers: number;
    overallAccuracyPercentage: number;
    averageTimeTakenSeconds: number;
    mostMasteredQuestion?: HighlightQuestion;
    mostChallengingQuestion?: HighlightQuestion;
    questions: QuestionStat[];
}

