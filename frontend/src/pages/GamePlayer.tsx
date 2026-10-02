import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createStompClient } from '../services/websocket';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Trophy, Loader2, Swords, BookOpen } from 'lucide-react';
import { soundManager } from '../services/soundManager';
import { getRomanTitle } from '../utils/romanTitles';
import PlayerReviewModal from '../components/PlayerReviewModal';
import type { Question, PlayerReview } from '../types';

export default function GamePlayer() {
    const { code } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [player, setPlayer] = useState<any>(location.state?.player || null);
    const [status, setStatus] = useState('WAITING');
    const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
    const [answered, setAnswered] = useState(false);
    const [feedback, setFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);
    const [scoreAwarded, setScoreAwarded] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(0);
    const [countdown, setCountdown] = useState(0);
    const [streakInfo, setStreakInfo] = useState({ streakBonus: 0, currentStreak: 0 });
    const [powersEnabled, setPowersEnabled] = useState(false);
    const [isBlinded, setIsBlinded] = useState(false);
    const [blindSecondsLeft, setBlindSecondsLeft] = useState(2);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [showBlindModal, setShowBlindModal] = useState(false);
    const [opponents, setOpponents] = useState<any[]>([]);
    const [activeHint, setActiveHint] = useState<string | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState<PlayerReview | null>(null);
    const [loadingReview, setLoadingReview] = useState(false);
    const handleGameEventRef = useRef<((event: any) => void) | null>(null);
    const blindTimerRef = useRef<any>(null);
    const answerResultRef = useRef<{ correct: boolean; streakBonus: number; currentStreak: number } | null>(null);

    const handleOpenReview = async () => {
        if (!code || !player?.id) return;
        setShowReviewModal(true);
        setLoadingReview(true);
        try {
            const res = await api.get(`/games/${code}/players/${player.id}/review`);
            setReviewData(res.data);
        } catch (err: any) {
            alert(err.response?.data?.message || "Não foi possível carregar o gabarito.");
            setShowReviewModal(false);
        } finally {
            setLoadingReview(false);
        }
    };

    const refreshOpponents = () => {
        if (!code || !player?.id) return;
        api.get(`/games/${code}`).then(res => {
            if (res.data?.players) {
                setOpponents(res.data.players.filter((p: any) => Number(p.id) !== Number(player.id)));
            }
        }).catch(() => {});
    };

    useEffect(() => {
        handleGameEventRef.current = (event: any) => {
            switch (event.type) {
                case 'POWERS_TOGGLED':
                    setPowersEnabled(event.payload);
                    break;
                case 'PLAYER_JOINED':
                    if (event.payload && Number(event.payload.id) !== Number(player?.id)) {
                        setOpponents(prev => {
                            if (prev.some(p => Number(p.id) === Number(event.payload.id))) return prev;
                            return [...prev, event.payload];
                        });
                    }
                    break;
                case 'PLAYER_BLINDED':
                    if (Number(event.payload) === Number(player?.id)) {
                        soundManager.playBlind();
                        setIsBlinded(true);
                        setBlindSecondsLeft(2);
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            try { navigator.vibrate([120, 60, 200]); } catch (_) {}
                        }
                        if (blindTimerRef.current) clearInterval(blindTimerRef.current);
                        blindTimerRef.current = setInterval(() => {
                            setBlindSecondsLeft(prev => {
                                if (prev <= 1) {
                                    clearInterval(blindTimerRef.current);
                                    setIsBlinded(false);
                                    return 0;
                                }
                                return prev - 1;
                            });
                        }, 1000);
                    }
                    break;
                case 'GAME_STARTED':
                    setStatus('STARTING');
                    setCountdown(3);
                    refreshOpponents();
                    break;
                case 'QUESTION_STARTED':
                    soundManager.playStartFanfare();
                    setStatus('QUESTION_ACTIVE');
                    setCurrentQuestion(event.payload);
                    setAnswered(false);
                    setFeedback(null);
                    setActiveHint(null);
                    answerResultRef.current = null;
                    setQuestionStartTime(Date.now());
                    refreshOpponents();
                    break;
                case 'QUESTION_ENDED':
                    setStatus('QUESTION_ENDED');
                    const playersList = Array.isArray(event.payload) 
                        ? event.payload 
                        : (event.payload?.leaderboard || []);
                    setLeaderboard(playersList);
                    const me = playersList.find((p: any) => Number(p.id) === Number(player?.id));
                    if (!answerResultRef.current) {
                        soundManager.playWrong();
                        setFeedback('WRONG');
                        setScoreAwarded(0);
                        setStreakInfo({ streakBonus: 0, currentStreak: 0 });
                    } else if (answerResultRef.current.correct) {
                        soundManager.playCorrect();
                        if (answerResultRef.current.streakBonus > 0 || answerResultRef.current.currentStreak > 1) {
                            setTimeout(() => soundManager.playStreak(), 350);
                        }
                    } else {
                        soundManager.playWrong();
                    }
                    if (me) setPlayer(me);
                    break;
                case 'FINISHED':
                    soundManager.playVictory();
                    setStatus('FINISHED');
                    const finalPlayers = Array.isArray(event.payload) 
                        ? event.payload 
                        : (event.payload?.leaderboard || []);
                    setLeaderboard(finalPlayers);
                    const meFinal = finalPlayers.find((p: any) => Number(p.id) === Number(player?.id));
                    if (meFinal) setPlayer(meFinal);
                    break;
            }
        };
    });

    useEffect(() => {
        if (!player || !code) {
            navigate('/');
            return;
        }
        
        api.get(`/games/${code}`).then(res => {
            setPowersEnabled(res.data.powersEnabled || false);
            setOpponents(res.data.players.filter((p: any) => Number(p.id) !== Number(player.id)));
        });

        const client = createStompClient();
        client.onConnect = () => {
            client.subscribe(`/topic/game/${code}`, (message) => {
                const event = JSON.parse(message.body);
                handleGameEventRef.current?.(event);
            });
        };
        client.activate();
        return () => {
            client.deactivate();
            if (blindTimerRef.current) clearInterval(blindTimerRef.current);
        };
    }, [code, player?.id]);

    // Countdown
    useEffect(() => {
        if (status === 'STARTING' && countdown > 0) {
            soundManager.playTick(600 + (3 - countdown) * 200);
            const t = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(t);
        }
    }, [countdown, status]);

    const submitAnswer = async (optionId: number) => {
        if (answered || status !== 'QUESTION_ACTIVE') return;
        soundManager.playAnswerClick();
        setAnswered(true);
        const timeTakenMs = Date.now() - questionStartTime;
        try {
            const res = await api.post(`/games/${code}/answer`, {
                playerId: player.id,
                optionId,
                timeTakenMs
            });
            const { correct, pointsAwarded, streakBonus, currentStreak } = res.data;
            setFeedback(correct ? 'CORRECT' : 'WRONG');
            setScoreAwarded(pointsAwarded);
            setStreakInfo({ streakBonus, currentStreak });
            answerResultRef.current = { correct, streakBonus, currentStreak };
        } catch {
            alert("Erro ao enviar resposta.");
            setAnswered(false);
        }
    };

    const useBlindPower = async (targetId: number) => {
        try {
            await api.post(`/games/${code}/power/blind`, { attackerId: player.id, targetId });
            soundManager.playBlind();
            setPlayer({ ...player, usedBlind: true });
            setShowBlindModal(false);
        } catch (error: any) {
            alert(error.response?.data?.message || "Erro ao usar poder.");
        }
    };

    const useHintPower = async () => {
        try {
            const res = await api.post(`/games/${code}/power/hint`, { playerId: player.id });
            soundManager.playHint();
            setActiveHint(res.data.hint);
            setPlayer({ ...player, usedHint: true });
        } catch (error: any) {
            alert(error.response?.data?.message || "Erro ao usar poder.");
        }
    };

    // ──── LOBBY DO JOGADOR ────
    if (status === 'WAITING') {
        return (
            <div className="flex flex-col items-center justify-center pt-16 animate-fade-in">
                <div className="card-arena p-8 text-center w-full max-w-sm glow-gold animate-scale-in">
                    <div className="w-24 h-24 mx-auto mb-4 bg-arena-500/10 rounded-2xl flex items-center justify-center border border-arena-500/30 text-5xl shadow-lg animate-float">
                        {player?.avatar || '⚔️'}
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Você está na arena!</h2>
                    <div className="text-3xl font-black text-gradient-gold py-2">{player?.nickname}</div>
                    <div className="flex items-center justify-center gap-2 text-dark-400 mt-4">
                        <Loader2 className="w-4 h-4 animate-spin text-arena-500" />
                        <p className="text-sm font-medium">Aguardando o host iniciar...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ──── CONTAGEM REGRESSIVA ────
    if (status === 'STARTING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[55vh]">
                {countdown > 0 ? (
                    <div key={countdown} className="animate-count-pop">
                        <span className="text-[10rem] font-black text-gradient-gold leading-none">{countdown}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center animate-bounce-in">
                        <Swords className="w-16 h-16 text-arena-400 mb-4" />
                        <h2 className="text-4xl font-black text-gradient-fire">VALENDO!</h2>
                    </div>
                )}
            </div>
        );
    }

    // ──── ALTERNATIVAS ────
    if (status === 'QUESTION_ACTIVE' && currentQuestion) {
        if (answered) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[55vh] animate-fade-in">
                    <div className="card-arena p-10 text-center">
                        <Loader2 className="w-10 h-10 text-arena-500 mx-auto mb-4 animate-spin" />
                        <h2 className="text-xl font-bold text-white mb-1">Resposta enviada!</h2>
                        <p className="text-dark-400 text-sm">Aguarde os outros gladiadores...</p>
                    </div>
                </div>
            );
        }

        const colors = [
            'bg-gradient-to-br from-red-500 to-red-600 active:from-red-600 active:to-red-700 shadow-red-500/30',
            'bg-gradient-to-br from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 shadow-blue-500/30',
            'bg-gradient-to-br from-yellow-500 to-amber-600 active:from-amber-600 active:to-amber-700 shadow-yellow-500/30',
            'bg-gradient-to-br from-green-500 to-emerald-600 active:from-emerald-600 active:to-emerald-700 shadow-green-500/30',
        ];
        const icons = ['🔺', '🔷', '⭐', '🟢'];

        return (
            <div className="flex flex-col h-[calc(100vh-100px)] pt-2 animate-fade-in relative">
                
                {isBlinded && (
                    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#1a0f07]/95 backdrop-blur-xl animate-screen-shake overflow-hidden shadow-[inset_0_0_120px_rgba(239,68,68,0.55)]">
                        {/* Sandstorm particles / Swirling background */}
                        <div className="absolute inset-0 bg-radial from-amber-600/25 via-orange-950/50 to-black/90 pointer-events-none" />
                        <div className="absolute w-[500px] h-[500px] rounded-full border-4 border-dashed border-amber-500/30 animate-sand-swirl pointer-events-none" />
                        <div className="absolute w-[350px] h-[350px] rounded-full border-2 border-dashed border-red-500/30 animate-sand-swirl pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '2.5s' }} />

                        {/* Floating Dust Particles */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(14)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute w-3 h-3 bg-amber-400/40 rounded-full blur-[1px] animate-sand-float"
                                    style={{
                                        top: `${10 + (i * 6)}%`,
                                        left: `${8 + (i * 7)}%`,
                                        animationDelay: `${i * 0.12}s`,
                                        animationDuration: `${0.8 + (i % 3) * 0.3}s`
                                    }}
                                />
                            ))}
                        </div>

                        {/* Main Impact Card */}
                        <div className="relative z-10 flex flex-col items-center text-center max-w-sm card-arena p-8 border-2 border-red-500/70 shadow-[0_0_60px_rgba(239,68,68,0.45)] animate-bounce-in">
                            <div className="relative mb-3">
                                <span className="text-7xl block animate-pulse">😵‍💫</span>
                                <span className="absolute -top-2 -right-3 text-3xl animate-bounce">🌪️</span>
                                <span className="absolute -bottom-2 -left-3 text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>💨</span>
                            </div>

                            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-400 mb-1 flex items-center gap-1.5">
                                <span>⚠️</span> GOLPE BAIXO DA ARENA <span>⚠️</span>
                            </span>

                            <h2 className="text-3xl font-black text-gradient-fire tracking-wider mb-2">
                                AREIA NOS OLHOS!
                            </h2>

                            <p className="text-amber-200/90 text-sm font-semibold mb-6 leading-relaxed">
                                Um gladiador oponente atirou areia quente nos seus olhos! Sua visão foi bloqueada.
                            </p>

                            {/* Progress / Countdown Badge */}
                            <div className="flex items-center gap-3 bg-black/70 border border-amber-500/40 px-5 py-2.5 rounded-full shadow-inner">
                                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                                <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                                    Limpando visão em: <strong className="text-white text-base font-black">{blindSecondsLeft}s</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* HUD Poderes */}
                {powersEnabled && !answered && (
                    <div className="flex gap-2 mb-3 px-1">
                        <button 
                            onClick={() => {
                                if (!player.usedBlind) {
                                    refreshOpponents();
                                    setShowBlindModal(true);
                                }
                            }}
                            disabled={player.usedBlind}
                            className={`flex-1 py-2 rounded-xl border flex flex-col items-center justify-center transition-all ${player.usedBlind ? 'opacity-30 border-dark-600 bg-dark-800' : 'border-orange-500/50 bg-gradient-to-t from-orange-600/40 to-transparent hover:from-orange-500/50 text-white shadow-[0_0_15px_rgba(249,115,22,0.2)]'}`}
                        >
                            <span className="text-xl mb-1 drop-shadow-md">👁️</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-200">Cegar</span>
                        </button>
                        <button 
                            onClick={() => !player.usedHint && useHintPower()}
                            disabled={player.usedHint}
                            className={`flex-1 py-2 rounded-xl border flex flex-col items-center justify-center transition-all ${player.usedHint ? 'opacity-30 border-dark-600 bg-dark-800' : 'border-blue-500/50 bg-gradient-to-t from-blue-600/40 to-transparent hover:from-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'}`}
                        >
                            <span className="text-xl mb-1 drop-shadow-md">💡</span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200">Dica</span>
                        </button>
                    </div>
                )}

                {/* Pergunta no celular do aluno */}
                <div className="card-arena p-5 mb-4 text-center glow-gold border-arena-700/30">
                    <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                        {currentQuestion.text}
                    </h2>
                    {activeHint && (
                        <div className="mt-4 bg-blue-500/20 border border-blue-400/30 rounded-lg p-3 text-blue-200 font-bold text-sm animate-bounce-in shadow-[0_0_15px_rgba(59,130,246,0.2)] text-left">
                            <span className="block text-blue-400 text-[10px] uppercase tracking-wider mb-1">Dica da sabedoria</span>
                            {activeHint}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 pb-4">
                    {currentQuestion.options.map((opt: any, i: number) => (
                        <button
                            key={opt.id}
                            onClick={() => submitAnswer(opt.id)}
                            className={`${colors[i % 4]} text-white rounded-2xl shadow-xl active:scale-[0.97] transition-transform duration-100 flex items-center justify-center gap-3 font-bold text-xl md:text-2xl p-4`}
                        >
                            <span className="text-2xl">{icons[i]}</span>
                            {opt.text}
                        </button>
                    ))}
                </div>

                {/* Blind Modal */}
                {showBlindModal && (
                    <div className="absolute inset-0 bg-dark-900/95 z-50 p-6 flex flex-col rounded-2xl animate-fade-in-up border border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                        <h3 className="text-orange-400 font-black text-2xl mb-1 text-center">👁️ Cegar</h3>
                        <p className="text-dark-400 text-sm text-center mb-6">Escolha quem não verá a pergunta por 2s</p>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 custom-scrollbar">
                            {opponents.length === 0 ? (
                                <div className="text-center text-dark-500 mt-10">Nenhum oponente disponível.</div>
                            ) : opponents.map(opp => (
                                <button key={opp.id} onClick={() => useBlindPower(opp.id)}
                                    className="w-full bg-dark-800 border border-dark-600 hover:border-orange-500 hover:bg-orange-500/20 p-4 rounded-xl font-bold text-left flex justify-between items-center transition-colors shadow-md">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{opp.avatar || '⚔️'}</span>
                                        <span className="text-white text-lg">{opp.nickname}</span>
                                    </div>
                                    <span className="text-orange-500 text-sm tracking-wider uppercase font-black bg-orange-500/10 px-3 py-1 rounded-lg">Cegar ⚡</span>
                                </button>
                            ))}
                        </div>
                        
                        <button onClick={() => setShowBlindModal(false)} className="btn-secondary w-full py-4 text-lg">
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ──── FEEDBACK ────
    if (status === 'QUESTION_ENDED') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
                <div className={`card-arena p-10 text-center w-full max-w-sm ${
                    feedback === 'CORRECT' ? 'border-green-500/30' : 'border-red-500/30'
                }`}>
                    {feedback === 'CORRECT' ? (
                        <>
                            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4 animate-bounce-in" />
                            <h2 className="text-4xl font-black text-green-400 mb-3">CORRETO!</h2>
                            <div className="inline-block bg-green-500/20 border border-green-500/30 text-green-300 font-black px-6 py-2 rounded-full text-2xl">
                                +{scoreAwarded}
                            </div>
                            
                            {streakInfo.currentStreak > 1 && (
                                <div className="flex flex-col items-center animate-fade-in-up mt-4">
                                    <div className="flex items-center gap-2 text-orange-500 font-black text-xl">
                                        <span className="text-2xl animate-pulse">🔥</span> STREAK {streakInfo.currentStreak}x!
                                    </div>
                                    {streakInfo.streakBonus > 0 && (
                                        <div className="text-orange-300 text-sm font-bold bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-full mt-2">
                                            +{streakInfo.streakBonus} Bônus
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4 animate-scale-in" />
                            <h2 className="text-4xl font-black text-red-400 mb-3">ERRADO</h2>
                            <p className="text-dark-400 text-sm">Nenhum ponto nesta rodada.</p>
                        </>
                    )}

                    <div className="mt-8 pt-6 border-t border-dark-600/30">
                        <div className="text-dark-400 text-xs font-bold uppercase tracking-widest mb-1">Pontuação Total</div>
                        <div className="text-3xl font-black text-gradient-gold">{player?.score}</div>
                    </div>
                </div>
            </div>
        );
    }

    // ──── FINALIZADO COM TÍTULO ROMANO ────
    if (status === 'FINISHED') {
        const myRank = leaderboard && leaderboard.length > 0
            ? leaderboard.findIndex((p: any) => Number(p.id) === Number(player?.id)) + 1
            : 0;
        const myTitle = getRomanTitle(myRank > 0 ? myRank : 1);

        return (
            <div className="flex flex-col items-center justify-center pt-8 pb-12 animate-fade-in px-4">
                <Trophy className="w-16 h-16 text-arena-400 mb-3 animate-bounce-in drop-shadow-[0_0_20px_rgba(245,197,24,0.4)]" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-arena-400 mb-1">Glória de Roma</span>
                <h2 className="text-3xl md:text-4xl font-black text-gradient-gold mb-2 text-center">ARENA ENCERRADA</h2>
                <p className="text-dark-400 mb-6 text-sm text-center">Obrigado por lutar bravamente no Coliseu!</p>

                {/* Roman Title Award Card */}
                <div className="card-arena p-6 text-center w-full max-w-sm mb-6 glow-gold border border-arena-600/40">
                    <span className="text-5xl block mb-2">{player?.avatar || '⚔️'}</span>
                    <h3 className="text-xl font-black text-white mb-2">{player?.nickname}</h3>

                    {/* Honor Badge */}
                    <div className={`px-3 py-1.5 rounded-full border text-xs font-black tracking-wider uppercase mb-1 inline-flex items-center gap-1.5 shadow-md ${myTitle.badgeClass}`}>
                        <span>{myTitle.icon}</span> {myTitle.title}
                    </div>
                    <p className="text-[11px] italic text-dark-300 font-serif mb-4">{myTitle.subtitle}</p>

                    {myRank > 0 && (
                        <div className="inline-block bg-dark-900/80 px-4 py-1.5 rounded-xl border border-dark-600/50 text-xs font-bold text-dark-300 mb-4 shadow-inner">
                            Classificação: <strong className="text-arena-400 font-black text-sm">{myRank}º Lugar</strong>
                        </div>
                    )}

                    <div className="pt-4 border-t border-dark-600/30">
                        <div className="text-dark-400 text-xs font-bold uppercase tracking-widest mb-1">Pontuação Final</div>
                        <div className="text-5xl font-black text-gradient-gold">{player?.score || 0}</div>
                    </div>
                </div>

                <div className="w-full max-w-sm flex flex-col gap-3">
                    <button
                        onClick={handleOpenReview}
                        className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-arena-500/20 text-dark-950 font-black text-sm py-3.5 tracking-wider uppercase transition-all hover:scale-105 active:scale-95"
                    >
                        <BookOpen className="w-5 h-5" /> VER MEU GABARITO & REVISÃO
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary w-full cursor-pointer"
                    >
                        VOLTAR AO INÍCIO
                    </button>
                </div>

                {showReviewModal && (
                    <PlayerReviewModal
                        review={reviewData}
                        loading={loadingReview}
                        onClose={() => setShowReviewModal(false)}
                    />
                )}
            </div>
        );
    }

    return null;
}
