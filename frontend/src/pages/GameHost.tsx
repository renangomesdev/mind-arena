import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, Trophy, ArrowRight, ArrowLeft, Timer, MessageSquare, SkipForward, Crown, Medal, Copy, QrCode, BarChart3, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { createStompClient } from '../services/websocket';
import { soundManager } from '../services/soundManager';
import { getRomanTitle } from '../utils/romanTitles';
import PedagogicalReportModal from '../components/PedagogicalReportModal';
import type { Quiz, Question, PedagogicalReport } from '../types';

interface Player {
    id: number;
    nickname: string;
    avatar?: string;
    score: number;
}

interface OptionStat {
    id: number;
    text: string;
    correct: boolean;
    count: number;
    percentage: number;
}

interface QuestionStats {
    questionId: number;
    questionText: string;
    questionIndex: number;
    totalAnswers: number;
    totalPlayers: number;
    correctCount: number;
    options: OptionStat[];
}

export default function GameHost() {
    const { code } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('WAITING');
    const [players, setPlayers] = useState<Player[]>([]);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [questionIndex, setQuestionIndex] = useState(-1);
    const [answersCount, setAnswersCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [leaderboard, setLeaderboard] = useState<Player[]>([]);
    const [countdown, setCountdown] = useState(0);
    const [powersEnabled, setPowersEnabled] = useState(false);
    const [questionStats, setQuestionStats] = useState<QuestionStats | null>(null);
    const [resultTab, setResultTab] = useState<'STATS' | 'LEADERBOARD'>('STATS');
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportData, setReportData] = useState<PedagogicalReport | null>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const handleGameEventRef = useRef<((event: any) => void) | null>(null);

    const handleOpenReport = async () => {
        setShowReportModal(true);
        setLoadingReport(true);
        try {
            const res = await api.get(`/games/${code}/report`);
            setReportData(res.data);
        } catch (err: any) {
            alert(err.response?.data?.message || "Não foi possível carregar o relatório pedagógico.");
            setShowReportModal(false);
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        handleGameEventRef.current = (event: any) => {
            switch (event.type) {
                case 'PLAYER_JOINED':
                    soundManager.playTick(1200);
                    setPlayers(prev => [...prev, event.payload]);
                    break;
                case 'GAME_STARTED':
                    soundManager.stopLobbyMusic();
                    setStatus('STARTING');
                    setCountdown(3);
                    break;
                case 'QUESTION_STARTED':
                    soundManager.playStartFanfare();
                    setStatus('QUESTION_ACTIVE');
                    setCurrentQuestion(event.payload);
                    setQuestionIndex(prev => prev + 1);
                    setTimeLeft(event.payload.timeLimitSeconds);
                    setAnswersCount(0);
                    setQuestionStats(null);
                    break;
                case 'ANSWER_SUBMITTED':
                    soundManager.playTick(900);
                    setAnswersCount(prev => prev + 1);
                    break;
                case 'QUESTION_ENDED':
                    soundManager.playStartFanfare();
                    setStatus('QUESTION_ENDED');
                    setResultTab('STATS');
                    const hostLeaderboard = Array.isArray(event.payload) 
                        ? event.payload 
                        : (event.payload?.leaderboard || []);
                    setLeaderboard(hostLeaderboard);
                    if (event.payload?.stats) {
                        setQuestionStats(event.payload.stats);
                    } else {
                        api.get(`/games/${code}/question-stats`).then(s => setQuestionStats(s.data)).catch(() => {});
                    }
                    break;
                case 'FINISHED':
                    soundManager.playVictory();
                    setStatus('FINISHED');
                    const finalLeaderboard = Array.isArray(event.payload) 
                        ? event.payload 
                        : (event.payload?.leaderboard || []);
                    setLeaderboard(finalLeaderboard);
                    break;
            }
        };
    });

    useEffect(() => {
        if (!code) return;
        api.get(`/games/${code}`).then(res => {
            const game = res.data;
            setStatus(game.status);
            setQuiz(game.quiz);
            setPlayers(game.players || []);
            setPowersEnabled(game.powersEnabled || false);
            if (game.status === 'QUESTION_ACTIVE' || game.status === 'QUESTION_ENDED') {
                setCurrentQuestion(game.quiz.questions[game.currentQuestionIndex]);
                setQuestionIndex(game.currentQuestionIndex);
                if (game.status === 'QUESTION_ENDED') {
                    api.get(`/games/${code}/question-stats`).then(s => setQuestionStats(s.data)).catch(() => {});
                }
            }
        });
        const client = createStompClient();
        client.onConnect = () => {
            client.subscribe(`/topic/game/${code}`, (message) => {
                const event = JSON.parse(message.body);
                if (event.type === 'POWERS_TOGGLED') {
                    setPowersEnabled(event.payload);
                }
                handleGameEventRef.current?.(event);
            });
        };
        client.activate();
        return () => { client.deactivate(); };
    }, [code]);

    // Lobby music
    useEffect(() => {
        if (status === 'WAITING') {
            soundManager.startLobbyMusic();
        } else {
            soundManager.stopLobbyMusic();
        }
        return () => {
            soundManager.stopLobbyMusic();
        };
    }, [status]);

    // Countdown 3-2-1
    useEffect(() => {
        if (status === 'STARTING' && countdown > 0) {
            soundManager.playTick(600 + (3 - countdown) * 200);
            const t = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(t);
        }
        if (status === 'STARTING' && countdown === 0) {
            soundManager.playStartFanfare();
            api.post(`/games/${code}/next`);
        }
    }, [countdown, status]);

    // Timer
    useEffect(() => {
        if (status === 'QUESTION_ACTIVE' && timeLeft > 0) {
            if (timeLeft <= 5) {
                soundManager.playUrgentTick();
            }
            const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(t);
        }
        if (status === 'QUESTION_ACTIVE' && timeLeft === 0) {
            api.post(`/games/${code}/end-question`);
        }
    }, [timeLeft, status]);

    const togglePowers = async () => {
        const newState = !powersEnabled;
        try {
            await api.post(`/games/${code}/toggle-powers`, { enable: newState });
        } catch (error: any) {
            alert(error.response?.data?.message || "Erro ao ativar poderes.");
        }
    };

    if (!quiz) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-dark-400 animate-pulse text-xl font-bold">Carregando arena...</div>
        </div>
    );

    // ──── LOBBY ────
    if (status === 'WAITING') {
        const canEnablePowers = quiz.questions.every(q => q.hasHint || (q.hint && q.hint.trim().length > 0));
        return (
            <div className="flex flex-col items-center pt-8 animate-fade-in">
                <div className="card-arena p-6 md:p-8 w-full max-w-2xl mb-8 glow-gold animate-scale-in flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Left: Code & Info */}
                    <div className="text-center md:text-left flex-1">
                        <span className="text-arena-400 font-bold tracking-[0.2em] text-xs uppercase block mb-1">
                            CÓDIGO DA ARENA
                        </span>
                        <div className="text-5xl md:text-6xl font-black text-gradient-gold tracking-[0.25em] py-2 select-all">
                            {code}
                        </div>
                        <p className="text-dark-300 text-sm mt-1 font-medium">
                            Acesse <span className="text-arena-400 font-bold underline">{window.location.host}</span> e digite o código acima.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                            <button
                                type="button"
                                onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/?code=${code}`);
                                    alert("Link da arena copiado para a área de transferência!");
                                }}
                                className="text-xs bg-dark-700/80 hover:bg-dark-600 text-dark-300 hover:text-white px-3 py-1.5 rounded-lg border border-dark-500/40 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                            >
                                <Copy className="w-3.5 h-3.5 text-arena-400" />
                                Copiar Link da Sala
                            </button>
                        </div>
                    </div>

                    {/* Right: QR Code */}
                    <div className="flex flex-col items-center bg-dark-900/90 p-4 rounded-2xl border border-arena-600/30 shadow-xl flex-shrink-0">
                        <div className="p-2.5 bg-white rounded-xl shadow-inner border border-arena-500/20">
                            <QRCodeSVG
                                value={`${window.location.origin}/?code=${code}`}
                                size={135}
                                bgColor="#ffffff"
                                fgColor="#0f0e0c"
                                level="M"
                            />
                        </div>
                        <span className="text-[11px] font-bold text-arena-400 mt-2.5 flex items-center gap-1">
                            <QrCode className="w-3.5 h-3.5 text-arena-500" />
                            Aponte a câmera do celular
                        </span>
                    </div>
                </div>
                
                <div className="mb-8 w-full max-w-lg bg-dark-900/80 p-4 rounded-2xl border border-orange-500/30 flex items-center justify-between shadow-lg backdrop-blur-md">
                    <div className="text-left">
                        <div className="text-orange-400 font-bold flex items-center gap-2">
                            ⚡ Poderes dos Jogadores
                        </div>
                        <div className="text-dark-400 text-xs mt-1 font-semibold">
                            {canEnablePowers ? "Cegar oponentes e revelar dicas." : "Requer dicas em TODAS as perguntas."}
                        </div>
                    </div>
                    <button 
                        onClick={togglePowers}
                        disabled={!canEnablePowers && !powersEnabled}
                        className={`w-14 h-8 rounded-full relative transition-colors ${powersEnabled ? 'bg-orange-500' : 'bg-dark-600'} ${(!canEnablePowers && !powersEnabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${powersEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>

                <div className="flex items-center gap-3 mb-6 animate-fade-in-up">
                    <div className="w-10 h-10 bg-arena-500/10 rounded-xl flex items-center justify-center border border-arena-500/20">
                        <Users className="w-5 h-5 text-arena-400" />
                    </div>
                    <h3 className="text-2xl font-black">
                        <span className="text-gradient-gold">{players.length}</span>
                        <span className="text-dark-400 ml-2 font-bold text-lg">jogadores na arena</span>
                    </h3>
                </div>

                <div className="flex flex-wrap justify-center gap-2.5 mb-10 w-full max-w-3xl min-h-[80px]">
                    {players.map((p, i) => (
                        <div key={p.id}
                            className="bg-dark-700/90 border border-arena-600/30 px-4 py-2 rounded-full font-bold text-arena-200 shadow-md animate-player-join flex items-center gap-2"
                            style={{ animationDelay: `${i * 0.05}s` }}
                        >
                            <span className="text-xl">{p.avatar || '⚔️'}</span>
                            <span>{p.nickname}</span>
                        </div>
                    ))}
                    {players.length === 0 && (
                        <div className="text-dark-500 italic mt-6 animate-pulse">Aguardando gladiadores entrarem...</div>
                    )}
                </div>

                <button
                    onClick={() => api.post(`/games/${code}/start`)}
                    disabled={players.length === 0}
                    className="btn-primary flex items-center gap-3 text-xl px-14 py-5 rounded-2xl animate-fade-in-up"
                >
                    <Play className="w-7 h-7 fill-current" /> INICIAR ARENA
                </button>
            </div>
        );
    }

    // ──── CONTAGEM REGRESSIVA ────
    if (status === 'STARTING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[65vh]">
                {countdown > 0 ? (
                    <div key={countdown} className="animate-count-pop">
                        <span className="text-[12rem] font-black text-gradient-gold leading-none drop-shadow-2xl">{countdown}</span>
                    </div>
                ) : (
                    <h2 className="text-5xl font-black text-gradient-fire animate-bounce-in">VALENDO!</h2>
                )}
            </div>
        );
    }

    // ──── PERGUNTA ATIVA ────
    if (status === 'QUESTION_ACTIVE' && currentQuestion) {
        const totalQuestions = quiz.questions?.length || 0;
        const timerPercent = currentQuestion.timeLimitSeconds > 0 ? (timeLeft / currentQuestion.timeLimitSeconds) * 100 : 0;
        const answerPercent = players.length > 0 ? (answersCount / players.length) * 100 : 0;

        return (
            <div className="flex flex-col pt-4 animate-fade-in">
                {/* Top Bar */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <div className="card-arena px-5 py-3 flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-arena-400" />
                        <span className="font-black text-sm text-dark-400">PERGUNTA</span>
                        <span className="font-black text-xl text-gradient-gold">{questionIndex + 1}/{totalQuestions}</span>
                    </div>

                    <div className={`card-arena px-6 py-3 flex items-center gap-3 ${timeLeft <= 3 ? 'animate-timer-pulse border-red-500/50' : ''}`}>
                        <Timer className={`w-6 h-6 ${timeLeft <= 3 ? 'text-red-500' : 'text-arena-400'}`} />
                        <span className={`text-4xl font-black tabular-nums ${timeLeft <= 3 ? 'text-red-500' : 'text-white'}`}>{timeLeft}</span>
                    </div>

                    <div className="card-arena px-5 py-3 flex items-center gap-3">
                        <Users className="w-5 h-5 text-arena-400" />
                        <span className="font-black text-xl text-arena-300">{answersCount}</span>
                        <span className="text-dark-500 font-bold">/ {players.length}</span>
                    </div>
                </div>

                {/* Timer bar */}
                <div className="w-full h-1.5 bg-dark-700 rounded-full mb-8 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${timeLeft <= 3 ? 'bg-red-500' : 'bg-arena-500'}`}
                        style={{ width: `${timerPercent}%` }} />
                </div>

                {/* Question */}
                <div className="text-center mb-10 animate-fade-in-down">
                    <h2 className="text-3xl md:text-5xl font-black leading-tight">{currentQuestion.text}</h2>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.options.map((opt: any, i: number) => {
                        const colors = [
                            'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/20',
                            'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/20',
                            'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/20',
                            'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/20'
                        ];
                        const icons = ['🔺', '🔷', '⭐', '🟢'];
                        return (
                            <div key={i}
                                className={`${colors[i % 4]} text-white p-6 rounded-2xl flex items-center gap-4 min-h-[100px] shadow-xl animate-fade-in-up`}
                                style={{ animationDelay: `${i * 0.1}s` }}
                            >
                                <span className="text-2xl">{icons[i]}</span>
                                <span className="text-xl md:text-2xl font-bold">{opt.text}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Answers progress */}
                <div className="mt-8 flex justify-center">
                    <div className="card-arena px-6 py-3 flex items-center gap-4 w-full max-w-md">
                        <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                            <div className="h-full bg-arena-500 rounded-full transition-all duration-300" style={{ width: `${answerPercent}%` }} />
                        </div>
                        <button onClick={() => api.post(`/games/${code}/end-question`)}
                            className="text-dark-400 hover:text-arena-400 transition-colors flex items-center gap-1 text-sm font-bold">
                            <SkipForward className="w-4 h-4" /> Pular
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ──── FIM DA PERGUNTA: GRÁFICO KAHOOT & RANKING ────
    if (status === 'QUESTION_ENDED') {
        const questionToDisplay = currentQuestion || (quiz && questionIndex >= 0 ? quiz.questions[questionIndex] : null);
        const totalAnswers = questionStats?.totalAnswers || 0;
        const correctCount = questionStats?.correctCount || 0;
        const accuracyPct = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
        
        const optionsList = questionStats?.options && questionStats.options.length > 0
            ? questionStats.options
            : (questionToDisplay?.options || []).map((o: any) => ({
                id: o.id,
                text: o.text,
                correct: o.correct,
                count: 0,
                percentage: 0
            }));
            
        const maxVotes = Math.max(...optionsList.map(o => o.count), 1);

        const colors = [
            { bar: 'bg-gradient-to-t from-red-600 to-red-500 shadow-red-500/20' },
            { bar: 'bg-gradient-to-t from-blue-600 to-blue-500 shadow-blue-500/20' },
            { bar: 'bg-gradient-to-t from-amber-600 to-yellow-500 shadow-yellow-500/20' },
            { bar: 'bg-gradient-to-t from-emerald-600 to-green-500 shadow-green-500/20' }
        ];
        const icons = ['🔺', '🔷', '⭐', '🟢'];

        return (
            <div className="flex flex-col items-center pt-4 w-full max-w-4xl mx-auto animate-fade-in">
                {/* Cabeçalho da Pergunta */}
                <div className="text-center mb-6 w-full animate-fade-in-down">
                    <span className="text-xs font-bold uppercase tracking-widest text-arena-400 bg-arena-500/10 border border-arena-500/20 px-3.5 py-1 rounded-full inline-block mb-3">
                        Pergunta {questionIndex + 1} de {quiz?.questions?.length || 0} Encerrada
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white px-4 leading-tight">
                        {questionToDisplay?.text || "Pergunta Concluída"}
                    </h2>
                </div>

                {/* Seletor de Abas: Gráfico vs Ranking */}
                <div className="flex items-center gap-2 p-1.5 bg-dark-900/80 border border-dark-600/40 rounded-2xl mb-8 shadow-lg">
                    <button
                        type="button"
                        onClick={() => setResultTab('STATS')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                            resultTab === 'STATS'
                                ? 'bg-arena-500 text-dark-900 shadow-md scale-102 glow-gold'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        Gráfico de Respostas ({totalAnswers})
                    </button>
                    <button
                        type="button"
                        onClick={() => setResultTab('LEADERBOARD')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all cursor-pointer ${
                            resultTab === 'LEADERBOARD'
                                ? 'bg-arena-500 text-dark-900 shadow-md scale-102 glow-gold'
                                : 'text-dark-400 hover:text-white hover:bg-dark-700/50'
                        }`}
                    >
                        <Crown className="w-4 h-4" />
                        Classificação Geral ({leaderboard.length})
                    </button>
                </div>

                {/* ──── TAB 1: GRÁFICO DE BARRAS ESTILO KAHOOT ──── */}
                {resultTab === 'STATS' && (
                    <div className="w-full flex flex-col items-center animate-fade-in">
                        {/* 4 Colunas com Barras de Resposta */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-8 items-end min-h-[310px]">
                            {optionsList.map((opt, i) => {
                                const heightPercent = totalAnswers > 0 
                                    ? Math.max(18, Math.round((opt.count / maxVotes) * 100))
                                    : 18;
                                const isCorrect = opt.correct;
                                const colorTheme = colors[i % 4];

                                return (
                                    <div
                                        key={opt.id || i}
                                        className={`flex flex-col items-center justify-end h-full p-4 rounded-2xl border transition-all ${
                                            isCorrect
                                                ? 'bg-dark-900/90 border-green-500 shadow-[0_0_25px_rgba(34,197,94,0.25)] glow-green'
                                                : 'bg-dark-900/60 border-dark-600/30'
                                        }`}
                                    >
                                        {/* Selo: Correta ou Incorreta */}
                                        <div className="mb-3 h-6 flex items-center">
                                            {isCorrect ? (
                                                <span className="bg-green-500/20 text-green-300 border border-green-500/40 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm animate-bounce-in">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                                    CORRETA
                                                </span>
                                            ) : (
                                                <span className="text-dark-500 text-[11px] font-bold flex items-center gap-1">
                                                    <XCircle className="w-3.5 h-3.5 text-dark-500" />
                                                    Incorreta
                                                </span>
                                            )}
                                        </div>

                                        {/* Barra Animada com Quantidade */}
                                        <div className="w-full h-44 flex items-end justify-center mb-3">
                                            <div
                                                className={`w-full max-w-[80px] rounded-xl ${colorTheme.bar} flex flex-col items-center justify-between py-2 shadow-xl transition-all duration-1000 ease-out`}
                                                style={{ height: `${heightPercent}%` }}
                                            >
                                                <span className="text-2xl font-black text-white drop-shadow-md">
                                                    {opt.count}
                                                </span>
                                                <span className="text-[10px] font-black text-white/90 uppercase tracking-wider">
                                                    {opt.percentage}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Símbolo e Texto da Opção */}
                                        <div className="w-full text-center pt-3 border-t border-dark-700/50">
                                            <div className="text-2xl mb-1">{icons[i]}</div>
                                            <p className={`text-xs md:text-sm font-bold line-clamp-2 ${isCorrect ? 'text-green-300 font-black' : 'text-dark-300'}`}>
                                                {opt.text}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Estatística de Resumo */}
                        <div className="bg-dark-900/80 border border-arena-600/30 px-6 py-3 rounded-2xl flex flex-wrap items-center justify-center gap-4 mb-8 shadow-md">
                            <span className="text-sm text-dark-300 font-medium text-center">
                                <strong className="text-arena-400 font-black text-base">{correctCount}</strong> de <strong className="text-white font-bold">{totalAnswers}</strong> gladiadores acertaram
                            </span>
                            <span className="bg-arena-500/15 text-arena-400 font-black text-xs px-3 py-1 rounded-lg border border-arena-500/25">
                                {accuracyPct}% de acerto
                            </span>
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button
                                type="button"
                                onClick={() => setResultTab('LEADERBOARD')}
                                className="btn-secondary flex items-center gap-2 text-base px-6 py-3 font-bold"
                            >
                                <Crown className="w-5 h-5 text-arena-400" /> VER RANKING
                            </button>
                            <button
                                type="button"
                                onClick={() => api.post(`/games/${code}/next`)}
                                className="btn-primary flex items-center gap-3 text-base px-8 py-3"
                            >
                                PRÓXIMA PERGUNTA <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ──── TAB 2: RANKING DOS GLADIADORES ──── */}
                {resultTab === 'LEADERBOARD' && (
                    <div className="w-full max-w-2xl flex flex-col items-center animate-fade-in">
                        <div className="w-full space-y-2 mb-8">
                            {leaderboard.slice(0, 5).map((p, i) => {
                                const medals = ['🥇', '🥈', '🥉'];
                                return (
                                    <div key={p.id}
                                        className="card-arena p-4 flex justify-between items-center animate-rank-slide"
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl w-8 text-center">
                                                {i < 3 ? medals[i] : <span className="text-dark-400 font-black">{i + 1}º</span>}
                                            </span>
                                            <span className="text-2xl">{p.avatar || '⚔️'}</span>
                                            <span className="text-lg font-bold text-white">{p.nickname}</span>
                                        </div>
                                        <span className="text-2xl font-black text-gradient-gold">{p.score}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center">
                            <button
                                type="button"
                                onClick={() => setResultTab('STATS')}
                                className="btn-secondary flex items-center gap-2 text-base px-6 py-3 font-bold"
                            >
                                <BarChart3 className="w-5 h-5 text-arena-400" /> VER GRÁFICO
                            </button>
                            <button
                                type="button"
                                onClick={() => api.post(`/games/${code}/next`)}
                                className="btn-primary flex items-center gap-3 text-base px-8 py-3"
                            >
                                PRÓXIMA PERGUNTA <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ──── PÓDIO FINAL COM TÍTULOS ROMANOS ────
    if (status === 'FINISHED') {
        const title1 = getRomanTitle(1);
        const title2 = getRomanTitle(2);
        const title3 = getRomanTitle(3);

        return (
            <div className="flex flex-col items-center pt-6 pb-12 w-full max-w-4xl mx-auto animate-fade-in">
                <div className="no-print flex flex-col items-center w-full">
                    <Trophy className="w-16 h-16 text-arena-400 mb-3 animate-bounce-in drop-shadow-[0_0_25px_rgba(245,197,24,0.4)]" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-arena-400 mb-1">Honra e Glória Eterna</span>
                    <h2 className="text-4xl md:text-5xl font-black text-gradient-gold mb-2 animate-fade-in-up">ARENA ENCERRADA</h2>
                    <p className="text-dark-400 mb-10 animate-fade-in-up text-sm md:text-base">Os deuses de Roma consagraram os maiores gladiadores!</p>

                {/* Podium Container - Balanced height to prevent any overlap */}
                <div className="flex items-end justify-center gap-4 md:gap-8 mb-12 min-h-[440px] pt-10 animate-fade-in-up w-full px-2">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                        <div className="flex flex-col items-center animate-fade-in-up flex-1 max-w-[170px]" style={{ animationDelay: '0.4s' }}>
                            <Medal className="w-6 h-6 text-gray-300 mb-1 drop-shadow" />
                            <span className="text-3xl mb-1">{leaderboard[1].avatar || '⚔️'}</span>
                            <span className="font-bold text-sm md:text-base mb-1 truncate max-w-full text-white">{leaderboard[1].nickname}</span>
                            
                            {/* Roman Title Badge */}
                            <div className={`px-2 py-0.5 rounded-full border text-[10px] md:text-xs font-black tracking-wider uppercase mb-1 flex items-center gap-1 ${title2.badgeClass}`}>
                                <span>{title2.icon}</span> {title2.title}
                            </div>
                            <span className="text-[10px] italic text-gray-400 mb-2 font-serif">{title2.subtitle}</span>

                            <span className="text-dark-300 font-black text-sm mb-2">{leaderboard[1].score} pts</span>
                            <div className="w-full h-[140px] md:h-[165px] bg-gradient-to-t from-gray-700 via-gray-500 to-gray-400 rounded-t-2xl flex flex-col justify-start items-center pt-4 text-3xl font-black text-gray-900 shadow-xl border-t-2 border-gray-300/40">
                                <span>2º</span>
                            </div>
                        </div>
                    )}

                    {/* 1st Place - Champion (Tallest!) */}
                    {leaderboard[0] && (
                        <div className="flex flex-col items-center animate-fade-in-up flex-1 max-w-[200px]" style={{ animationDelay: '0.2s' }}>
                            <Crown className="w-8 h-8 text-arena-400 mb-1 animate-float drop-shadow-[0_0_15px_rgba(245,197,24,0.6)]" />
                            <span className="text-4xl mb-1">{leaderboard[0].avatar || '⚔️'}</span>
                            <span className="font-black text-base md:text-xl text-arena-300 mb-1 truncate max-w-full drop-shadow">{leaderboard[0].nickname}</span>
                            
                            {/* Roman Title Badge */}
                            <div className={`px-3 py-1 rounded-full border text-xs md:text-sm font-black tracking-wider uppercase mb-1 flex items-center gap-1.5 ${title1.badgeClass}`}>
                                <span>{title1.icon}</span> {title1.title}
                            </div>
                            <span className="text-xs italic text-arena-400/80 mb-2 font-serif">{title1.subtitle}</span>

                            <span className="text-arena-200 font-black text-base mb-2">{leaderboard[0].score} pts</span>
                            <div className="w-full h-[210px] md:h-[250px] bg-gradient-to-t from-amber-700 via-arena-500 to-yellow-400 rounded-t-2xl flex flex-col justify-start items-center pt-5 text-4xl font-black text-dark-900 shadow-2xl glow-gold border-t-2 border-yellow-200/60">
                                <span>1º</span>
                            </div>
                        </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                        <div className="flex flex-col items-center animate-fade-in-up flex-1 max-w-[170px]" style={{ animationDelay: '0.6s' }}>
                            <Medal className="w-6 h-6 text-amber-500 mb-1 drop-shadow" />
                            <span className="text-3xl mb-1">{leaderboard[2].avatar || '⚔️'}</span>
                            <span className="font-bold text-sm md:text-base mb-1 truncate max-w-full text-white">{leaderboard[2].nickname}</span>
                            
                            {/* Roman Title Badge */}
                            <div className={`px-2 py-0.5 rounded-full border text-[10px] md:text-xs font-black tracking-wider uppercase mb-1 flex items-center gap-1 ${title3.badgeClass}`}>
                                <span>{title3.icon}</span> {title3.title}
                            </div>
                            <span className="text-[10px] italic text-amber-500/80 mb-2 font-serif">{title3.subtitle}</span>

                            <span className="text-orange-300 font-black text-sm mb-2">{leaderboard[2].score} pts</span>
                            <div className="w-full h-[85px] md:h-[105px] bg-gradient-to-t from-orange-800 via-amber-700 to-amber-600 rounded-t-2xl flex flex-col justify-start items-center pt-3 text-3xl font-black text-orange-950 shadow-xl border-t-2 border-amber-400/40">
                                <span>3º</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Demais Gladiadores (4º em diante) */}
                {leaderboard.length > 3 && (
                    <div className="w-full max-w-xl card-arena p-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                        <span className="text-[11px] font-bold text-dark-400 uppercase tracking-wider block mb-3 text-center">
                            Demais Combatentes da Arena
                        </span>
                        <div className="space-y-2">
                            {leaderboard.slice(3).map((p, idx) => {
                                const rank = idx + 4;
                                const title = getRomanTitle(rank);
                                return (
                                    <div key={p.id} className="flex justify-between items-center p-2.5 bg-dark-900/60 rounded-xl border border-dark-700/50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-dark-400 w-6 text-center">{rank}º</span>
                                            <span className="text-xl">{p.avatar || '⚔️'}</span>
                                            <div>
                                                <span className="font-bold text-white text-sm block">{p.nickname}</span>
                                                <span className="text-[10px] text-dark-400 flex items-center gap-1">
                                                    {title.icon} {title.title}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="font-bold text-arena-400 text-sm">{p.score} pts</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                    <button
                        onClick={handleOpenReport}
                        className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl flex items-center gap-2.5 shadow-xl shadow-amber-500/20 text-sm tracking-wider uppercase transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                        <FileText className="w-5 h-5" />
                        RELATÓRIO PEDAGÓGICO (PDF)
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary flex items-center gap-2 cursor-pointer"
                    >
                        <ArrowLeft className="w-5 h-5" /> VOLTAR AO INÍCIO
                    </button>
                </div>
                </div>

                {showReportModal && (
                    <PedagogicalReportModal
                        report={reportData}
                        loading={loadingReport}
                        onClose={() => setShowReportModal(false)}
                    />
                )}
            </div>
        );
    }

    return null;
}
