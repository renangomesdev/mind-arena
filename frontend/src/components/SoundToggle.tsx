import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../services/soundManager';

export default function SoundToggle() {
    const [muted, setMuted] = useState(soundManager.isMuted());

    useEffect(() => {
        const unsubscribe = soundManager.onMuteChange(isMuted => setMuted(isMuted));
        return unsubscribe;
    }, []);

    const toggle = () => {
        const next = soundManager.toggleMute();
        setMuted(next);
        if (!next) {
            // Toca um pequeno feedback sonoro para o usuário ouvir que ligou
            soundManager.playTick(1000);
        }
    };

    return (
        <button
            onClick={toggle}
            title={muted ? "Ativar Efeitos Sonoros" : "Silenciar Sons"}
            className="p-2.5 rounded-xl bg-dark-700/80 hover:bg-dark-600 border border-dark-500/40 text-arena-400 hover:text-white transition-all flex items-center gap-1.5 shadow-md active:scale-95 group"
        >
            {muted ? (
                <>
                    <VolumeX className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-dark-400 hidden md:inline">Mudo</span>
                </>
            ) : (
                <>
                    <Volume2 className="w-5 h-5 text-arena-400 group-hover:scale-110 transition-transform animate-pulse" />
                    <span className="text-xs font-bold text-arena-300 hidden md:inline">Sons Ativos</span>
                </>
            )}
        </button>
    );
}
