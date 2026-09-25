import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { createStompClient } from '../services/websocket';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Trophy, Loader2, Swords, Crown } from 'lucide-react';
import { soundManager } from '../services/soundManager';
import type { Question } from '../types';

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
    const [showBlindModal, setShowBlindModal] = useState(false);
    const [opponents, setOpponents] = useState<any[]>([]);
    const [activeHint, setActiveHint] = useState<string | null>(null);
    const handleGameEventRef = useRef<((event: any) => void) | null>(null);

    useEffect(() => {
        handleGameEventRef.current = (event: any) => {
            switch (event.type) {
                case 'POWERS_TOGGLED':
                    setPowersEnabled(event.payload);
                    break;
                case 'PLAYER_BLINDED':
                    if (event.payload === player?.id) {
                        soundManager.playBlind();
                        setIsBlinded(true);
                        setTimeout(() => setIsBlinded(false), 2000);
                    }
                    break;
                case 'GAME_STARTED':
                    setStatus('STARTING');
                    setCountdown(3);
                    break;
                case 'QUESTION_STARTED':
                    soundManager.playStartFanfare();
                    setStatus('QUESTION_ACTIVE');
                    setCurrentQuestion(event.payload);
                    setAnswered(false);
                    setFeedback(null);
                    setActiveHint(null);
                    setQuestionStartTime(Date.now());
                    break;
                case 'QUESTION_ENDED':
                    setStatus('QUESTION_ENDED');
                    const me = event.payload.find((p: any) => p.id === player?.id);
                    if (me && !answered) {
                        soundManager.playWrong();
                        setFeedback('WRONG');
                        setScoreAwarded(0);
                        setStreakInfo({ streakBonus: 0, currentStreak: 0 });
                    }
                    if (me) setPlayer(me);
                    break;
                case 'FINISHED':
                    soundManager.playVictory();
                    setStatus('FINISHED');
                    const meFinal = event.payload.find((p: any) => p.id === player?.id);
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
            setOpponents(res.data.players.filter((p: any) => p.id !== player.id));
        });

        const client = createStompClient();
        client.onConnect = () => {
            client.subscribe(`/topic/game/${code}`, (message) => {
                const event = JSON.parse(message.body);
                handleGameEventRef.current?.(event);
            });
        };
        client.activate();
        return () => { client.deactivate(); };
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
            if (correct) {
                soundManager.playCorrect();
                if (streakBonus > 0 || currentStreak > 1) {
                    setTimeout(() => soundManager.playStreak(), 350);
                }
            } else {
                soundManager.playWrong();
            }
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
                    <div className="absolute inset-0 bg-dark-900/95 z-[60] flex flex-col items-center justify-center rounded-2xl animate-fade-in">
                        <div className="text-6xl mb-4 animate-bounce">😵</div>
                        <h2 className="text-3xl font-black text-red-500 tracking-wider">CEGADO!</h2>
                    </div>
                )}
                
                {/* HUD Poderes */}
                {powersEnabled && !answered && (
                    <div className="flex gap-2 mb-3 px-1">
                        <button 
                            onClick={() => !player.usedBlind && setShowBlindModal(true)}
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

    // ──── FINALIZADO ────
    if (status === 'FINISHED') {
        return (
            <div className="flex flex-col items-center justify-center pt-10 animate-fade-in">
                <Trophy className="w-16 h-16 text-arena-400 mb-4 animate-bounce-in" />
                <h2 className="text-3xl font-black text-gradient-gold mb-2">ARENA ENCERRADA</h2>
                <p className="text-dark-400 mb-8 text-sm">Obrigado por jogar, gladiador!</p>

                <div className="card-arena p-8 text-center w-full max-w-sm mb-8 glow-gold">
                    <Crown className="w-10 h-10 text-arena-400 mx-auto mb-3" />
                    <div className="text-dark-400 text-xs font-bold uppercase tracking-widest mb-2">Sua Pontuação Final</div>
                    <div className="text-6xl font-black text-gradient-gold">{player?.score}</div>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="btn-secondary w-full max-w-sm"
                >
                    VOLTAR AO INÍCIO
                </button>
            </div>
        );
    }

    return null;
}
