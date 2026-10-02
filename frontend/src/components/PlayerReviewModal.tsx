import { 
    X, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    Award, 
    BookOpen, 
    Lightbulb,
    Target
} from 'lucide-react';
import type { PlayerReview } from '../types';

interface PlayerReviewModalProps {
    review: PlayerReview | null;
    loading: boolean;
    onClose: () => void;
}

export default function PlayerReviewModal({ review, loading, onClose }: PlayerReviewModalProps) {
    if (!review && !loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-2xl bg-dark-900 border border-arena-600/40 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden my-auto animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-dark-850 border-b border-dark-700/60">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-arena-500/20 text-arena-400 flex items-center justify-center border border-arena-500/30">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-black text-white text-base">Meu Gabarito & Revisão</h3>
                            <p className="text-xs text-dark-400">Desempenho detalhado de cada questão</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-dark-400 hover:text-white rounded-lg hover:bg-dark-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-10 h-10 border-4 border-arena-500/30 border-t-arena-500 rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-dark-300 text-sm font-medium">Buscando seu gabarito com os escribas de Roma...</p>
                        </div>
                    ) : review ? (
                        <>
                            {/* Performance Header Banner */}
                            <div className="card-arena p-4 grid grid-cols-3 gap-2 text-center border border-arena-500/30 glow-gold">
                                <div className="border-r border-dark-700/50 pr-2">
                                    <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1">
                                        Acertos
                                    </span>
                                    <div className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center justify-center gap-1">
                                        <Target className="w-4 h-4 hidden sm:inline" />
                                        <span>{review.correctCount}/{review.totalQuestions}</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-emerald-500/90">
                                        {review.accuracyPercentage}%
                                    </span>
                                </div>

                                <div className="border-r border-dark-700/50 pr-2">
                                    <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1">
                                        Classificação
                                    </span>
                                    <div className="text-xl sm:text-2xl font-black text-arena-400 flex items-center justify-center gap-1">
                                        <Award className="w-4 h-4 hidden sm:inline" />
                                        <span>{review.rank}º</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-arena-300/80">
                                        {review.avatar} {review.nickname}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold text-dark-400 uppercase tracking-wider block mb-1">
                                        Pontuação
                                    </span>
                                    <div className="text-xl sm:text-2xl font-black text-gradient-gold">
                                        {review.finalScore}
                                    </div>
                                    <span className="text-[11px] text-dark-400 font-medium">
                                        pts acumulados
                                    </span>
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-3">
                                {review.questions.map((q) => {
                                    const timeSec = (q.timeTakenMs / 1000).toFixed(1);
                                    return (
                                        <div
                                            key={q.questionId}
                                            className={`p-4 rounded-2xl border transition-all ${
                                                q.correct
                                                    ? 'bg-emerald-950/20 border-emerald-500/30'
                                                    : 'bg-rose-950/20 border-rose-500/30'
                                            }`}
                                        >
                                            {/* Question Status Header */}
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center ${
                                                        q.correct ? 'bg-emerald-500 text-dark-950' : 'bg-rose-500 text-white'
                                                    }`}>
                                                        {q.orderIndex}
                                                    </span>
                                                    <span className="text-xs font-bold text-dark-300">
                                                        Questão {q.orderIndex}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {q.correct ? (
                                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            +{q.pointsAwarded} pts
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-extrabold uppercase flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" />
                                                            0 pts
                                                        </span>
                                                    )}

                                                    {q.timeTakenMs > 0 && (
                                                        <span className="text-[10px] text-dark-400 flex items-center gap-0.5">
                                                            <Clock className="w-3 h-3" /> {timeSec}s
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Question Text */}
                                            <p className="text-sm font-bold text-white mb-3 leading-snug">
                                                {q.questionText}
                                            </p>

                                            {/* Answers Breakdown */}
                                            <div className="space-y-1.5 text-xs">
                                                {/* What the student answered */}
                                                <div className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                                                    q.correct
                                                        ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-200'
                                                        : 'bg-rose-900/30 border-rose-500/40 text-rose-200'
                                                }`}>
                                                    <span className="font-extrabold text-[11px] min-w-[85px] text-dark-400 block pt-0.5">
                                                        Sua resposta:
                                                    </span>
                                                    <div className="flex-1 font-semibold flex items-center gap-1.5">
                                                        {q.correct ? (
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                                                        )}
                                                        <span>{q.selectedOptionText}</span>
                                                    </div>
                                                </div>

                                                {/* If student missed, show the correct answer */}
                                                {!q.correct && q.correctOptionText && (
                                                    <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 flex items-start gap-2">
                                                        <span className="font-extrabold text-[11px] min-w-[85px] text-emerald-400 block pt-0.5">
                                                            Resposta certa:
                                                        </span>
                                                        <div className="flex-1 font-semibold flex items-center gap-1.5 text-emerald-300">
                                                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                                            <span>{q.correctOptionText}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Hint / Study Takeaway */}
                                            {q.hint && (
                                                <div className="mt-2.5 p-2 rounded-xl bg-dark-900/80 border border-dark-700/60 text-[11px] text-arena-300/90 flex items-start gap-1.5">
                                                    <Lightbulb className="w-3.5 h-3.5 text-arena-400 flex-shrink-0 mt-0.5" />
                                                    <span>
                                                        <strong className="text-arena-400">Dica de Estudo:</strong> {q.hint}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : null}
                </div>

                {/* Footer Action */}
                <div className="px-6 py-3.5 bg-dark-850 border-t border-dark-700/60 flex justify-end">
                    <button
                        onClick={onClose}
                        className="btn-secondary px-6 py-2 text-xs font-bold cursor-pointer"
                    >
                        Fechar Gabarito
                    </button>
                </div>
            </div>
        </div>
    );
}
