import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Play, Trophy, ArrowRight, ArrowLeft, Timer, MessageSquare, SkipForward, Crown, Medal } from 'lucide-react';
import { api } from '../services/api';
import { createStompClient } from '../services/websocket';
import { soundManager } from '../services/soundManager';
import type { Quiz, Question } from '../types';

interface Player {
    id: number;
    nickname: string;
    avatar?: string;
    score: number;
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
    const handleGameEventRef = useRef<((event: any) => void) | null>(null);

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
                    break;
                case 'ANSWER_SUBMITTED':
                    soundManager.playTick(900);
                    setAnswersCount(prev => prev + 1);
                    break;
                case 'QUESTION_ENDED':
                    soundManager.playStartFanfare();
                    setStatus('QUESTION_ENDED');
                    setLeaderboard(event.payload);
                    break;
                case 'FINISHED':
                    soundManager.playVictory();
                    setStatus('FINISHED');
                    setLeaderboard(event.payload);
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
        const canEnablePowers = quiz.questions.every(q => q.hint && q.hint.trim().length > 0);
        return (
            <div className="flex flex-col items-center pt-8 animate-fade-in">
                <div className="card-arena p-10 text-center w-full max-w-lg mb-8 glow-gold animate-scale-in">
                    <h2 className="text-arena-400 font-bold tracking-[0.2em] text-sm mb-3">CÓDIGO DA ARENA</h2>
                    <div className="text-6xl md:text-7xl font-black text-gradient-gold tracking-[0.3em] py-4 select-all">
                        {code}
                    </div>
                    <p className="text-dark-400 mt-3 text-sm">Acesse o site e entre com este código</p>
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

    // ──── RANKING PARCIAL ────
    if (status === 'QUESTION_ENDED') {
        return (
            <div className="flex flex-col items-center pt-8 w-full max-w-2xl mx-auto animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <Crown className="w-8 h-8 text-arena-400" />
                    <h2 className="text-3xl font-black text-gradient-gold">RANKING</h2>
                </div>

                <div className="w-full space-y-2 mb-10">
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

                <button
                    onClick={() => api.post(`/games/${code}/next`)}
                    className="btn-primary flex items-center gap-3 text-lg px-10"
                >
                    PRÓXIMA PERGUNTA <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        );
    }

    // ──── PÓDIO FINAL ────
    if (status === 'FINISHED') {
        return (
            <div className="flex flex-col items-center pt-8 animate-fade-in">
                <Trophy className="w-20 h-20 text-arena-400 mb-4 animate-bounce-in" />
                <h2 className="text-4xl md:text-5xl font-black text-gradient-gold mb-2 animate-fade-in-up">ARENA ENCERRADA</h2>
                <p className="text-dark-400 mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>Parabéns a todos os gladiadores!</p>

                {/* Podium */}
                <div className="flex items-end justify-center gap-3 md:gap-6 mb-12 h-72 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    {/* 2nd */}
                    {leaderboard[1] && (
                        <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <Medal className="w-8 h-8 text-gray-400 mb-1" />
                            <span className="text-3xl mb-1">{leaderboard[1].avatar || '⚔️'}</span>
                            <span className="font-bold text-sm md:text-base mb-1 truncate max-w-[90px]">{leaderboard[1].nickname}</span>
                            <span className="text-dark-400 font-bold text-sm mb-2">{leaderboard[1].score}</span>
                            <div className="w-20 md:w-28 h-28 md:h-36 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-xl flex justify-center items-start pt-4 text-3xl font-black text-gray-800 shadow-xl">2</div>
                        </div>
                    )}
                    {/* 1st */}
                    {leaderboard[0] && (
                        <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                            <Crown className="w-10 h-10 text-arena-400 mb-1 animate-float" />
                            <span className="text-4xl mb-1">{leaderboard[0].avatar || '⚔️'}</span>
                            <span className="font-black text-base md:text-lg text-arena-300 mb-1 truncate max-w-[100px]">{leaderboard[0].nickname}</span>
                            <span className="text-arena-200 font-bold text-sm mb-2">{leaderboard[0].score}</span>
                            <div className="w-24 md:w-32 h-40 md:h-52 bg-gradient-to-t from-arena-700 to-arena-400 rounded-t-xl flex justify-center items-start pt-5 text-4xl font-black text-dark-900 shadow-2xl glow-gold">1</div>
                        </div>
                    )}
                    {/* 3rd */}
                    {leaderboard[2] && (
                        <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                            <Medal className="w-8 h-8 text-orange-400 mb-1" />
                            <span className="text-2xl mb-1">{leaderboard[2].avatar || '⚔️'}</span>
                            <span className="font-bold text-sm md:text-base mb-1 truncate max-w-[90px]">{leaderboard[2].nickname}</span>
                            <span className="text-orange-300 font-bold text-sm mb-2">{leaderboard[2].score}</span>
                            <div className="w-20 md:w-28 h-20 md:h-28 bg-gradient-to-t from-orange-700 to-orange-400 rounded-t-xl flex justify-center items-start pt-4 text-3xl font-black text-orange-900 shadow-xl">3</div>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="btn-secondary flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.7s' }}
                >
                    <ArrowLeft className="w-5 h-5" /> VOLTAR AO INÍCIO
                </button>
            </div>
        );
    }

    return null;
}
