export class SoundEngine {
    private ctx: AudioContext;

    constructor() {
        const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
        this.ctx = new AudioContextClass();
    }

    public resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public playPlantSound() {
        this.playSound(600, 'sine', 0.1);
    }

    public playDropSound() {
        this.playSound(150, 'square', 0.15);
    }

    public playErrorSound() {
        this.playSound(100, 'sawtooth', 0.2);
    }

    private playSound(freq: number, type: OscillatorType, duration: number) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, this.ctx.currentTime + duration);
        osc.stop(this.ctx.currentTime + duration);
    }
}