import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, ChevronUp, ChevronDown, Clock } from 'lucide-react';
import type { Quiz, Question } from '../types';
import { api } from '../services/api';

export default function CreateQuiz() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [questions, setQuestions] = useState<Question[]>([
        { text: '', timeLimitSeconds: 15, orderIndex: 1, options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ] }
    ]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            {
                text: '',
                timeLimitSeconds: 15,
                orderIndex: questions.length + 1,
                options: [
                    { text: '', isCorrect: true },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false }
                ]
            }
        ]);
    };

    const removeQuestion = (index: number) => {
        const newQs = [...questions];
        newQs.splice(index, 1);
        setQuestions(newQs.map((q, i) => ({ ...q, orderIndex: i + 1 })));
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        if ((direction === 'up' && index === 0) || (direction === 'down' && index === questions.length - 1)) return;
        const newQs = [...questions];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newQs[index], newQs[swapIndex]] = [newQs[swapIndex], newQs[index]];
        setQuestions(newQs.map((q, i) => ({ ...q, orderIndex: i + 1 })));
    };

    const updateQuestion = (index: number, field: string, value: any) => {
        const newQs = [...questions];
        newQs[index] = { ...newQs[index], [field]: value };
        setQuestions(newQs);
    };

    const updateOption = (qIndex: number, optIndex: number, text: string) => {
        const newQs = [...questions];
        newQs[qIndex].options[optIndex] = { ...newQs[qIndex].options[optIndex], text };
        setQuestions([...newQs]);
    };

    const setCorrectOption = (qIndex: number, correctOptIndex: number) => {
        const newQs = [...questions];
        newQs[qIndex].options = newQs[qIndex].options.map((opt, i) => ({
            ...opt,
            isCorrect: i === correctOptIndex
        }));
        setQuestions([...newQs]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const quiz: Quiz = { title, description, questions };
            await api.post('/quizzes', quiz);
            navigate('/');
        } catch {
            alert("Erro ao salvar o quiz. Tente novamente.");
            setSaving(false);
        }
    };

    const optionColors = [
        { bg: 'bg-red-500/10', border: 'border-red-500/30', activeBg: 'bg-red-500/20', activeBorder: 'border-red-500', icon: '🔴' },
        { bg: 'bg-blue-500/10', border: 'border-blue-500/30', activeBg: 'bg-blue-500/20', activeBorder: 'border-blue-500', icon: '🔵' },
        { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', activeBg: 'bg-yellow-500/20', activeBorder: 'border-yellow-500', icon: '🟡' },
        { bg: 'bg-green-500/10', border: 'border-green-500/30', activeBg: 'bg-green-500/20', activeBorder: 'border-green-500', icon: '🟢' },
    ];

    return (
        <div className="pb-20 animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2.5 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors border border-dark-500/30">
                    <ArrowLeft className="w-5 h-5 text-arena-400" />
                </button>
                <div>
                    <h2 className="text-3xl font-black text-gradient-gold">Criar seu Quiz</h2>
                    <p className="text-dark-400 text-sm">Monte suas perguntas e desafie a turma</p>
                </div>
            </div>

            {/* Título e Descrição */}
            <div className="card-arena p-6 mb-8 space-y-4 animate-fade-in-up">
                <div>
                    <label className="block text-arena-400 mb-2 font-bold text-xs uppercase tracking-widest">Título da Arena</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ex: Desafio de Programação"
                        className="input-arena text-lg font-bold"
                    />
                </div>
                <div>
                    <label className="block text-arena-400 mb-2 font-bold text-xs uppercase tracking-widest">Descrição (opcional)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Breve descrição do quiz..."
                        className="input-arena"
                    />
                </div>
            </div>

            {/* Perguntas */}
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="card-arena p-6 relative animate-fade-in-up" style={{ animationDelay: `${qIndex * 0.05}s` }}>
                        {/* Badge da pergunta */}
                        <div className="absolute -top-3 -left-3 w-10 h-10 bg-gradient-to-br from-arena-500 to-arena-700 rounded-xl flex items-center justify-center font-black text-dark-900 text-lg shadow-lg">
                            {qIndex + 1}
                        </div>

                        {/* Botões de mover */}
                        <div className="absolute -top-3 -right-3 flex gap-1">
                            <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0}
                                className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center border border-dark-500/30 hover:bg-dark-600 disabled:opacity-30 transition-all">
                                <ChevronUp className="w-4 h-4 text-arena-400" />
                            </button>
                            <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === questions.length - 1}
                                className="w-8 h-8 bg-dark-700 rounded-lg flex items-center justify-center border border-dark-500/30 hover:bg-dark-600 disabled:opacity-30 transition-all">
                                <ChevronDown className="w-4 h-4 text-arena-400" />
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 mb-6 mt-3">
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-dark-400 mb-2 font-bold text-xs uppercase tracking-widest">Enunciado</label>
                                    <textarea
                                        value={q.text}
                                        onChange={e => updateQuestion(qIndex, 'text', e.target.value)}
                                        className="input-arena min-h-[80px] resize-none"
                                        placeholder="Digite a pergunta aqui..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-orange-400/80 mb-2 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                                        💡 Dica (Obrigatório para Poderes)
                                    </label>
                                    <input
                                        type="text"
                                        value={q.hint || ''}
                                        onChange={e => updateQuestion(qIndex, 'hint', e.target.value)}
                                        className="input-arena border-orange-500/30 focus:border-orange-500"
                                        placeholder="Dica para os alunos..."
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-36">
                                <label className="block text-dark-400 mb-2 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Tempo
                                </label>
                                <select
                                    value={q.timeLimitSeconds}
                                    onChange={e => updateQuestion(qIndex, 'timeLimitSeconds', parseInt(e.target.value))}
                                    className="input-arena text-center font-bold"
                                >
                                    <option value="5">5 segundos</option>
                                    <option value="10">10 segundos</option>
                                    <option value="15">15 segundos</option>
                                    <option value="20">20 segundos</option>
                                    <option value="30">30 segundos</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {q.options.map((opt, optIndex) => {
                                const color = optionColors[optIndex];
                                const isCorrect = opt.isCorrect;
                                return (
                                    <div
                                        key={optIndex}
                                        onClick={() => setCorrectOption(qIndex, optIndex)}
                                        className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                            isCorrect
                                                ? `${color.activeBg} ${color.activeBorder} shadow-md`
                                                : `${color.bg} ${color.border} hover:opacity-80`
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                            isCorrect ? 'border-green-400 bg-green-500 scale-110' : 'border-dark-400'
                                        }`}>
                                            {isCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="text-sm mr-1">{color.icon}</span>
                                        <input
                                            type="text"
                                            value={opt.text}
                                            onChange={e => updateOption(qIndex, optIndex, e.target.value)}
                                            onClick={e => e.stopPropagation()}
                                            placeholder={`Alternativa ${optIndex + 1}`}
                                            className="bg-transparent border-none focus:outline-none w-full font-semibold text-white"
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {questions.length > 1 && (
                            <button
                                onClick={() => removeQuestion(qIndex)}
                                className="mt-5 flex items-center gap-2 text-red-400/70 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Excluir pergunta
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Ações */}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
                <button
                    onClick={addQuestion}
                    className="flex-1 bg-dark-800 hover:bg-dark-700 border-2 border-dashed border-dark-500/50 text-dark-400 hover:text-arena-400 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 hover:border-arena-700/30"
                >
                    <Plus className="w-5 h-5" /> ADICIONAR PERGUNTA
                </button>
                <button
                    onClick={handleSave}
                    disabled={!title || saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 text-lg"
                >
                    <Save className="w-5 h-5" /> {saving ? 'SALVANDO...' : 'SALVAR QUIZ'}
                </button>
            </div>
        </div>
    );
}
