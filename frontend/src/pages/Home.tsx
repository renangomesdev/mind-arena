import { Link, useNavigate } from 'react-router-dom';
import { Play, Plus, Users, Crown, Zap, Sparkles, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Quiz } from '../types';
import logo from '../assets/logo.jpg';

export default function Home() {
    const navigate = useNavigate();
    const [gameCode, setGameCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedQuizToHost, setSelectedQuizToHost] = useState<Quiz | null>(null);
    const [enablePowers, setEnablePowers] = useState(false);
    const [creatingGame, setCreatingGame] = useState(false);

    useEffect(() => {
        api.get('/quizzes').then(res => setQuizzes(res.data)).catch(console.error);
    }, []);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (gameCode.trim() && nickname.trim()) {
            setLoading(true);
            try {
                const res = await api.post(`/games/${gameCode}/players`, { nickname });
                navigate(`/play/${gameCode}`, { state: { player: res.data } });
            } catch (error: any) {
                alert(error.response?.data?.message || "Ops! Não foi possível entrar nessa partida.");
                setLoading(false);
            }
        }
    };

    const openHostModal = (quiz: Quiz) => {
        setSelectedQuizToHost(quiz);
        const allHaveHints = Boolean(
            quiz.questions &&
            quiz.questions.length > 0 &&
            quiz.questions.every(q => q.hint && q.hint.trim().length > 0)
        );
        setEnablePowers(allHaveHints);
    };

    const confirmHostGame = async () => {
        if (!selectedQuizToHost?.id) return;
        setCreatingGame(true);
        try {
            const res = await api.post(`/games/quiz/${selectedQuizToHost.id}`, {
                powersEnabled: enablePowers
            });
            navigate(`/host/${res.data.code}`);
        } catch (error: any) {
            alert(error.response?.data?.message || "Erro ao criar partida.");
            setCreatingGame(false);
        }
    };

    return (
        <div className="flex flex-col items-center pt-6 pb-12 animate-fade-in">

            {/* Hero Section */}
            <div className="text-center mb-10 animate-fade-in-up">
                <img src={logo} alt="Mind Arena" className="max-w-xs md:max-w-sm mx-auto mb-6 rounded-2xl shadow-2xl glow-gold animate-float" />
                <p className="text-dark-400 text-lg font-medium flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5 text-arena-500" />
                    Desafie sua mente. Domine a arena.
                    <Zap className="w-5 h-5 text-arena-500" />
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">

                {/* ÁREA DO ALUNO */}
                <div className="card-arena p-8 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="w-16 h-16 bg-arena-500/10 rounded-2xl flex items-center justify-center mb-5 border border-arena-500/20">
                        <Users className="w-8 h-8 text-arena-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-1 text-gradient-gold">ENTRAR NA ARENA</h3>
                    <p className="text-dark-400 text-sm mb-6">Entre com o código do seu professor</p>
                    <form onSubmit={handleJoin} className="w-full space-y-3">
                        <input
                            type="text"
                            placeholder="CÓDIGO DA PARTIDA"
                            className="input-arena text-center text-xl font-black uppercase tracking-[0.3em]"
                            value={gameCode}
                            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            required
                        />
                        <input
                            type="text"
                            placeholder="Seu apelido"
                            className="input-arena text-center text-lg font-bold"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            maxLength={15}
                            required
                        />
                        <button
                            type="submit"
                            disabled={gameCode.length < 3 || nickname.length < 2 || loading}
                            className="btn-primary w-full flex items-center justify-center gap-3 text-lg"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            {loading ? 'ENTRANDO...' : 'JOGAR AGORA'}
                        </button>
                    </form>
                </div>

                {/* ÁREA DO PROFESSOR */}
                <div className="card-arena p-8 flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="w-16 h-16 bg-arena-500/10 rounded-2xl flex items-center justify-center mb-5 border border-arena-500/20">
                        <Crown className="w-8 h-8 text-arena-400" />
                    </div>
                    <h3 className="text-2xl font-black mb-1 text-gradient-gold">ÁREA DO PROFESSOR</h3>
                    <p className="text-dark-400 text-sm mb-6">Crie quizzes e inicie partidas</p>

                    <Link
                        to="/create-quiz"
                        className="btn-primary w-full flex items-center justify-center gap-2 mb-6 text-lg"
                    >
                        <Plus className="w-6 h-6" /> CRIAR NOVO QUIZ
                    </Link>

                    <div className="w-full text-left">
                        <h4 className="text-xs font-bold text-dark-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-arena-600" />
                            Quizzes Disponíveis
                        </h4>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                            {quizzes.map(q => (
                                <div key={q.id} className="bg-dark-900/50 p-4 rounded-xl border border-dark-600/30 flex justify-between items-center group hover:border-arena-700/30 transition-all duration-200">
                                    <div className="truncate pr-4">
                                        <div className="font-bold text-white truncate">{q.title}</div>
                                        <div className="text-xs text-dark-400">{q.questions?.length || 0} perguntas</div>
                                    </div>
                                    <button
                                        onClick={() => openHostModal(q)}
                                        className="bg-arena-500/10 text-arena-400 hover:bg-arena-500 hover:text-dark-900 px-4 py-2 rounded-lg font-black text-sm transition-all duration-200 flex-shrink-0 border border-arena-500/20 hover:border-arena-500"
                                    >
                                        INICIAR
                                    </button>
                                </div>
                            ))}
                            {quizzes.length === 0 && (
                                <div className="text-center text-dark-400 text-sm py-6 italic">
                                    Nenhum quiz ainda. Crie o primeiro!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* MODAL DE CONFIGURAÇÃO DA PARTIDA */}
            {selectedQuizToHost && (
                <div className="fixed inset-0 bg-[#0f0e0c]/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="card-arena p-6 md:p-8 w-full max-w-lg glow-gold animate-scale-in relative border border-arena-600/40">
                        <button
                            type="button"
                            onClick={() => setSelectedQuizToHost(null)}
                            className="absolute top-4 right-4 text-dark-400 hover:text-white p-2 rounded-lg hover:bg-dark-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-12 h-12 bg-arena-500/10 rounded-xl flex items-center justify-center border border-arena-500/30 text-arena-400">
                                <Crown className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-gradient-gold">CRIAR PARTIDA</h3>
                                <p className="text-dark-400 text-xs font-semibold uppercase tracking-wider">Configurações da Arena</p>
                            </div>
                        </div>

                        {/* Quiz Info */}
                        <div className="bg-dark-900/60 p-4 rounded-xl border border-dark-600/40 mb-6">
                            <span className="text-[10px] text-dark-400 font-bold uppercase tracking-wider block mb-1">Quiz Selecionado</span>
                            <h4 className="text-lg font-bold text-white mb-1">{selectedQuizToHost.title}</h4>
                            {selectedQuizToHost.description && (
                                <p className="text-dark-400 text-xs mb-2">{selectedQuizToHost.description}</p>
                            )}
                            <span className="inline-block bg-arena-500/10 border border-arena-500/20 text-arena-300 text-xs font-bold px-2.5 py-1 rounded-md">
                                {selectedQuizToHost.questions?.length || 0} perguntas
                            </span>
                        </div>

                        {/* Configuração de Poderes */}
                        {(() => {
                            const allHaveHints = Boolean(
                                selectedQuizToHost.questions &&
                                selectedQuizToHost.questions.length > 0 &&
                                selectedQuizToHost.questions.every(q => q.hint && q.hint.trim().length > 0)
                            );
                            return (
                                <div className="bg-gradient-to-br from-orange-500/10 via-dark-800 to-dark-900 p-5 rounded-2xl border border-orange-500/30 mb-6">
                                    <div className="flex items-center justify-between gap-4 mb-3">
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl mt-0.5">⚡</span>
                                            <div>
                                                <h5 className="font-black text-white text-base flex items-center gap-2">
                                                    Poderes dos Gladiadores
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${enablePowers ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-dark-600 text-dark-400'}`}>
                                                        {enablePowers ? 'ATIVADO' : 'DESATIVADO'}
                                                    </span>
                                                </h5>
                                                <p className="text-xs text-dark-400 mt-1">
                                                    Cada jogador recebe 2 poderes na partida: <strong>Cegar oponente (2s)</strong> e <strong>Dica da pergunta</strong>.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Toggle switch */}
                                        <button
                                            type="button"
                                            disabled={!allHaveHints && !enablePowers}
                                            onClick={() => setEnablePowers(!enablePowers)}
                                            className={`w-14 h-8 rounded-full relative transition-colors flex-shrink-0 ${
                                                enablePowers ? 'bg-orange-500' : 'bg-dark-600'
                                            } ${!allHaveHints && !enablePowers ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div
                                                className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
                                                    enablePowers ? 'translate-x-7' : 'translate-x-1'
                                                }`}
                                            />
                                        </button>
                                    </div>

                                    {/* Status / Aviso de dicas */}
                                    {allHaveHints ? (
                                        <div className="text-[11px] text-green-400/90 font-medium bg-green-500/10 border border-green-500/20 rounded-lg p-2.5 flex items-center gap-2">
                                            <span>✓</span>
                                            Todas as perguntas possuem dicas cadastradas. Poderes disponíveis!
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-2">
                                            <span>⚠️</span>
                                            <span>Algumas perguntas deste quiz não têm dicas. Cadastre dicas em todas as perguntas para ativar os poderes.</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Botões de Ação */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setSelectedQuizToHost(null)}
                                className="btn-secondary flex-1 py-3 text-sm font-bold"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="button"
                                onClick={confirmHostGame}
                                disabled={creatingGame}
                                className="btn-primary flex-1 py-3 text-base flex items-center justify-center gap-2"
                            >
                                <Play className="w-5 h-5 fill-current" />
                                {creatingGame ? 'INICIANDO...' : 'CRIAR PARTIDA'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
