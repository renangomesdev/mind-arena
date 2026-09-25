// Mind Arena Sound Engine (Web Audio API)
// 100% offline, zero latency, zero external downloads

class SoundManager {
    private ctx: AudioContext | null = null;
    private muted: boolean = false;
    private lobbyInterval: any = null;
    private listeners: ((muted: boolean) => void)[] = [];

    constructor() {
        const saved = localStorage.getItem('mind_arena_muted');
        if (saved !== null) {
            this.muted = saved === 'true';
        }
        // Auto-unlock AudioContext on user interaction
        if (typeof window !== 'undefined') {
            const unlock = () => {
                this.initContext();
                window.removeEventListener('click', unlock);
                window.removeEventListener('keydown', unlock);
                window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('click', unlock);
            window.addEventListener('keydown', unlock);
            window.addEventListener('touchstart', unlock);
        }
    }

    private initContext(): AudioContext | null {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        return this.ctx;
    }

    public isMuted(): boolean {
        return this.muted;
    }

    public toggleMute(): boolean {
        this.muted = !this.muted;
        localStorage.setItem('mind_arena_muted', String(this.muted));
        if (this.muted) {
            this.stopLobbyMusic();
        }
        this.listeners.forEach(cb => cb(this.muted));
        return this.muted;
    }

    public onMuteChange(cb: (muted: boolean) => void): () => void {
        this.listeners.push(cb);
        return () => {
            this.listeners = this.listeners.filter(l => l !== cb);
        };
    }

    // ─── 1. TICK (Contagem Regressiva) ───
    public playTick(pitch: number = 880) {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
    }

    // ─── 2. HORN / START FANFARE (Início da Pergunta/Batalha) ───
    public playStartFanfare() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Acorde maior épico (C4, E4, G4, C5)
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + idx * 0.06);

            // Filtro lowpass para dar tom de trompete
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800, now);

            gain.gain.setValueAtTime(0.18, now + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.06);
            osc.stop(now + 0.65);
        });
    }

    // ─── 3. TIMER TICK (Últimos segundos tensos) ───
    public playUrgentTick() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    // ─── 4. CLICK DE RESPOSTA ───
    public playAnswerClick() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
    }

    // ─── 5. RESPOSTA CORRETA (Vitória / Acorde Triunfante Dourado) ───
    public playCorrect() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Acorde C maior brilhante (G4, C5, E5, G5, C6)
        const notes = [392.00, 523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.07);

            gain.gain.setValueAtTime(0.22, now + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + idx * 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.07);
            osc.stop(now + 1.0);
        });
    }

    // ─── 6. RESPOSTA ERRADA (Buzzer Abafado) ───
    public playWrong() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.4);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.45);
    }

    // ─── 7. STREAK BONUS (Chama Ascendente) ───
    public playStreak() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.35);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    // ─── 8. PODER CEGAR (Trovão / Maldição) ───
    public playBlind() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Impacto de sub-grave sombrio
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    // ─── 9. PODER DICA (Sino Mágico Cristalino) ───
    public playHint() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const notes = [800, 1200, 1600, 2000];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + idx * 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + idx * 0.05);
            osc.stop(now + 0.6);
        });
    }

    // ─── 10. VITÓRIA / PÓDIO (Grande Fanfarra Final) ───
    public playVictory() {
        if (this.muted) return;
        const ctx = this.initContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        // Melodia de celebração triunfante: Sol, Dó, Mi, Sol, Dó alto com sustentação
        const notes = [
            { f: 392.00, t: 0.00, d: 0.15 },
            { f: 523.25, t: 0.16, d: 0.15 },
            { f: 659.25, t: 0.32, d: 0.15 },
            { f: 783.99, t: 0.48, d: 0.28 },
            { f: 659.25, t: 0.78, d: 0.15 },
            { f: 1046.50, t: 0.94, d: 0.80 },
        ];

        notes.forEach(n => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n.f, now + n.t);

            gain.gain.setValueAtTime(0.25, now + n.t);
            gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now + n.t);
            osc.stop(now + n.t + n.d + 0.05);
        });
    }

    // ─── 11. MÚSICA DE LOBBY / TENSÃO PROCEDURAL ───
    public startLobbyMusic() {
        if (this.muted || this.lobbyInterval) return;
        const ctx = this.initContext();
        if (!ctx) return;

        let beat = 0;
        const bassLine = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83]; // A2, C3, D3, E3

        this.lobbyInterval = setInterval(() => {
            if (this.muted) {
                this.stopLobbyMusic();
                return;
            }
            const c = this.initContext();
            if (!c) return;

            const now = c.currentTime;
            const bassOsc = c.createOscillator();
            const bassGain = c.createGain();

            bassOsc.type = 'triangle';
            bassOsc.frequency.setValueAtTime(bassLine[beat % bassLine.length], now);

            bassGain.gain.setValueAtTime(0.12, now);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

            bassOsc.connect(bassGain);
            bassGain.connect(c.destination);

            bassOsc.start(now);
            bassOsc.stop(now + 0.3);

            // Shaker / Hi-hat sutil no contratempo
            if (beat % 2 === 1) {
                const hatOsc = c.createOscillator();
                const hatGain = c.createGain();
                hatOsc.type = 'sine';
                hatOsc.frequency.setValueAtTime(3500, now);
                hatGain.gain.setValueAtTime(0.03, now);
                hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                hatOsc.connect(hatGain);
                hatGain.connect(c.destination);
                hatOsc.start(now);
                hatOsc.stop(now + 0.05);
            }

            beat++;
        }, 320); // ~187 BPM ritmo de lobby
    }

    public stopLobbyMusic() {
        if (this.lobbyInterval) {
            clearInterval(this.lobbyInterval);
            this.lobbyInterval = null;
        }
    }
}

export const soundManager = new SoundManager();
