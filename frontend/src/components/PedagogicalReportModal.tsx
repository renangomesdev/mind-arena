import { 
    X, 
    Printer, 
    AlertTriangle, 
    Clock, 
    Users, 
    Award, 
    BookOpen,
    TrendingUp,
    ShieldAlert
} from 'lucide-react';
import type { PedagogicalReport } from '../types';

interface PedagogicalReportModalProps {
    report: PedagogicalReport | null;
    loading: boolean;
    onClose: () => void;
}

export default function PedagogicalReportModal({ report, loading, onClose }: PedagogicalReportModalProps) {
    if (!report && !loading) return null;

    const handlePrint = () => {
        window.print();
    };

    const getDiagnosisBadge = (diagnosis: string) => {
        switch (diagnosis) {
            case 'CONSOLIDADO':
                return {
                    bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
                    dot: 'bg-emerald-500',
                    label: 'CONCEITO CONSOLIDADO'
                };
            case 'BOM':
                return {
                    bg: 'bg-blue-50 text-blue-800 border-blue-300',
                    dot: 'bg-blue-500',
                    label: 'ASSIMILAÇÃO BOA'
                };
            case 'PONTO DE ATENÇÃO':
                return {
                    bg: 'bg-amber-50 text-amber-800 border-amber-300',
                    dot: 'bg-amber-500',
                    label: 'PONTO DE ATENÇÃO'
                };
            case 'CRÍTICO':
                return {
                    bg: 'bg-rose-50 text-rose-800 border-rose-300',
                    dot: 'bg-rose-500',
                    label: 'GAP CRÍTICO (REVISÃO)'
                };
            default:
                return {
                    bg: 'bg-slate-50 text-slate-700 border-slate-300',
                    dot: 'bg-slate-400',
                    label: diagnosis
                };
        }
    };

    const criticalQuestions = report?.questions.filter(q => q.accuracyPercentage < 60) || [];

    const formattedDate = report?.generatedAt 
        ? new Date(report.generatedAt).toLocaleString('pt-BR', {
            dateStyle: 'long',
            timeStyle: 'short'
        })
        : '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            {/* Print Stylesheet */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 12mm 10mm;
                    }
                    html, body {
                        background: #ffffff !important;
                        color: #0f172a !important;
                    }
                    body * {
                        visibility: hidden !important;
                    }
                    #pedagogical-report-root, #pedagogical-report-root * {
                        visibility: visible !important;
                    }
                    #pedagogical-report-root {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .page-break-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            ` }} />

            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scale-in">
                {/* Header Action Bar (On Screen Only) */}
                <div className="no-print flex items-center justify-between px-6 py-4 bg-slate-800/90 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Relatório Pedagógico da Partida</h3>
                            <p className="text-xs text-slate-400">Diagnóstico formativo da turma para o professor</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            disabled={loading || !report}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
                        >
                            <Printer className="w-4 h-4" />
                            Salvar como PDF / Imprimir
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Document Container */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/50">
                    {loading ? (
                        <div className="py-24 text-center">
                            <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-300 font-medium">Consolidando métricas pedagógicas da partida...</p>
                        </div>
                    ) : report ? (
                        <div 
                            id="pedagogical-report-root" 
                            className="pedagogical-report-sheet bg-white text-slate-900 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200"
                        >
                            {/* Document Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900/10 pb-6 mb-8 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-amber-700 font-extrabold text-xs uppercase tracking-widest mb-1">
                                        <span>⚔️ Mind Arena</span>
                                        <span>•</span>
                                        <span>Avaliação Formativa</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                        {report.quizTitle}
                                    </h1>
                                    {report.quizDescription && (
                                        <p className="text-sm text-slate-600 mt-1 max-w-xl">
                                            {report.quizDescription}
                                        </p>
                                    )}
                                </div>
                                <div className="text-left sm:text-right text-xs text-slate-500 space-y-1 sm:min-w-[190px]">
                                    <div><span className="font-semibold text-slate-700">Data:</span> {formattedDate}</div>
                                    <div><span className="font-semibold text-slate-700">Código da Sala:</span> <span className="font-mono font-bold text-slate-900">{report.gameCode}</span></div>
                                    <div><span className="font-semibold text-slate-700">Participantes:</span> {report.totalPlayers} gladiadores</div>
                                    <div><span className="font-semibold text-slate-700">Respostas Totais:</span> {report.totalAnswers}</div>
                                </div>
                            </div>

                            {/* KPI Highlights Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {/* Overall Accuracy */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-slate-500 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Aproveitamento</span>
                                        <TrendingUp className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900">
                                            {report.overallAccuracyPercentage}%
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                                            report.overallAccuracyPercentage >= 75 
                                                ? 'bg-emerald-100 text-emerald-800' 
                                                : report.overallAccuracyPercentage >= 50 
                                                    ? 'bg-amber-100 text-amber-800' 
                                                    : 'bg-rose-100 text-rose-800'
                                        }`}>
                                            {report.overallAccuracyPercentage >= 75 ? 'Turma Sólida' : report.overallAccuracyPercentage >= 50 ? 'Médio Desempenho' : 'Atenção Necessária'}
                                        </span>
                                    </div>
                                </div>

                                {/* Average Time */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-slate-500 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Tempo Médio</span>
                                        <Clock className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900">
                                            {report.averageTimeTakenSeconds}s
                                        </div>
                                        <span className="text-[11px] text-slate-500 font-medium">por pergunta</span>
                                    </div>
                                </div>

                                {/* Top Mastered Concept */}
                                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-emerald-800 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Maior Domínio</span>
                                        <Award className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-emerald-900">
                                            {report.mostMasteredQuestion ? `${report.mostMasteredQuestion.accuracyPercentage}%` : 'N/D'}
                                        </div>
                                        <p className="text-[11px] text-emerald-800 line-clamp-1 font-medium mt-0.5">
                                            {report.mostMasteredQuestion ? `Q${report.mostMasteredQuestion.orderIndex}: ${report.mostMasteredQuestion.text}` : 'Sem dados'}
                                        </p>
                                    </div>
                                </div>

                                {/* Most Challenging Concept */}
                                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex flex-col justify-between">
                                    <div className="flex items-center justify-between text-rose-800 mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider">Maior Dificuldade</span>
                                        <ShieldAlert className="w-4 h-4 text-rose-600" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-rose-900">
                                            {report.mostChallengingQuestion ? `${report.mostChallengingQuestion.accuracyPercentage}%` : 'N/D'}
                                        </div>
                                        <p className="text-[11px] text-rose-800 line-clamp-1 font-medium mt-0.5">
                                            {report.mostChallengingQuestion ? `Q${report.mostChallengingQuestion.orderIndex}: ${report.mostChallengingQuestion.text}` : 'Sem dados'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Pedagogical Action Plan Banner */}
                            <div className="page-break-avoid p-5 rounded-2xl border mb-8 bg-gradient-to-r from-slate-50 to-slate-100/80 border-slate-200">
                                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2 mb-2">
                                    <span>🎯</span> Plano de Ação Didático para a Próxima Aula
                                </h4>
                                {criticalQuestions.length > 0 ? (
                                    <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                                        <p>
                                            Identificamos <strong>{criticalQuestions.length} conceito(s) crítico(s)</strong> que demandam reforço conceitual:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-slate-800 font-medium pl-1">
                                            {criticalQuestions.map(q => (
                                                <li key={q.questionId}>
                                                    <strong>Questão {q.orderIndex}</strong> ({q.accuracyPercentage}% de acerto): <em>"{q.text}"</em>
                                                    {q.topMistakeOptionText && (
                                                        <span className="text-rose-700 block ml-4 text-[11px]">
                                                            ↳ Alerta de pegadinha: {q.topMistakePercentage}% dos alunos foram induzidos ao erro na alternativa: <u>"{q.topMistakeOptionText}"</u>.
                                                        </span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : (
                                    <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                                        ✓ A turma demonstrou sólido aproveitamento em todos os tópicos (nenhuma pergunta abaixo de 60% de acerto). O conteúdo programático pode avançar normalmente.
                                    </p>
                                )}
                            </div>

                            {/* Question-by-Question Detailed Breakdown */}
                            <div className="mb-6">
                                <h3 className="font-black text-slate-900 text-lg uppercase tracking-wider mb-4 border-b pb-2">
                                    Raio-X das Questões
                                </h3>

                                <div className="space-y-6">
                                    {report.questions.map((q) => {
                                        const badge = getDiagnosisBadge(q.pedagogicalDiagnosis);
                                        return (
                                            <div 
                                                key={q.questionId} 
                                                className="page-break-avoid p-5 rounded-2xl border border-slate-200 bg-white shadow-sm"
                                            >
                                                {/* Question Header & Diagnosis */}
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                                                            {q.orderIndex}
                                                        </span>
                                                        <h4 className="font-bold text-slate-900 text-sm md:text-base">
                                                            {q.text}
                                                        </h4>
                                                    </div>
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border flex items-center gap-1.5 self-start sm:self-auto ${badge.bg}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                        {badge.label}
                                                    </span>
                                                </div>

                                                {/* Mini Stats Bar */}
                                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                                        <span><strong>{q.totalAnswers}</strong> respostas ({q.correctAnswers} acertos)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>Tempo médio: <strong>{q.averageTimeSeconds}s</strong></span>
                                                    </div>
                                                    <div className="ml-auto font-black text-slate-900 flex items-center gap-1.5">
                                                        <span>Taxa de Acerto:</span>
                                                        <span className={`px-2 py-0.5 rounded-md font-black ${
                                                            q.accuracyPercentage >= 75 ? 'bg-emerald-100 text-emerald-800' :
                                                            q.accuracyPercentage >= 50 ? 'bg-amber-100 text-amber-800' :
                                                            'bg-rose-100 text-rose-800'
                                                        }`}>
                                                            {q.accuracyPercentage}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Options Distribution Bars */}
                                                <div className="space-y-2 mb-2">
                                                    {q.options.map(opt => {
                                                        const isTopDistractor = !opt.correct && opt.count > 0 && opt.text === q.topMistakeOptionText && q.accuracyPercentage < 70;
                                                        return (
                                                            <div 
                                                                key={opt.optionId} 
                                                                className={`p-2.5 rounded-xl border text-xs transition-colors ${
                                                                    opt.correct 
                                                                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold' 
                                                                        : isTopDistractor 
                                                                            ? 'bg-rose-50/60 border-rose-200 text-rose-950' 
                                                                            : 'bg-slate-50 border-slate-200 text-slate-700'
                                                                }`}
                                                            >
                                                                <div className="flex items-center justify-between mb-1.5 gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        {opt.correct ? (
                                                                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">✓</span>
                                                                        ) : isTopDistractor ? (
                                                                            <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-black">!</span>
                                                                        ) : (
                                                                            <span className="w-4 h-4 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[10px]">•</span>
                                                                        )}
                                                                        <span>{opt.text}</span>
                                                                        {opt.correct && (
                                                                            <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">Correta</span>
                                                                        )}
                                                                        {isTopDistractor && (
                                                                            <span className="text-[10px] font-extrabold uppercase bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded">Pegadinha Frequente</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="font-mono font-bold text-slate-800">
                                                                        {opt.count} ({opt.percentage}%)
                                                                    </span>
                                                                </div>

                                                                {/* Progress bar */}
                                                                <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full ${
                                                                            opt.correct 
                                                                                ? 'bg-emerald-500' 
                                                                                : isTopDistractor 
                                                                                    ? 'bg-rose-400' 
                                                                                    : 'bg-slate-400'
                                                                        }`}
                                                                        style={{ width: `${opt.percentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Distractor insight alert if accuracy is poor */}
                                                {q.topMistakeOptionText && q.accuracyPercentage < 60 && (
                                                    <div className="text-[11px] text-amber-800 bg-amber-50/80 border border-amber-200/80 rounded-lg p-2 flex items-center gap-1.5 mt-2">
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                                        <span>
                                                            <strong>Diagnóstico de Engano:</strong> {q.topMistakePercentage}% dos alunos confundiram o conceito marcando <em>"{q.topMistakeOptionText}"</em>.
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Document Footer */}
                            <div className="border-t border-slate-200 pt-4 mt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                                <div>Mind Arena • Tecnologia para Avaliação Formativa em Tempo Real</div>
                                <div>Documento Pedagógico de Uso Exclusivo do Professor</div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
