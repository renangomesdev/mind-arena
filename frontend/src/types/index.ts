
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
