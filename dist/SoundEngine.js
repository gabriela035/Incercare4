export class SoundEngine {
    constructor() {
        const AudioContextClass = (window.AudioContext || window.webkitAudioContext);
        this.ctx = new AudioContextClass();
    }
    resume() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    playPlantSound() {
        this.playSound(600, 'sine', 0.1);
    }
    playDropSound() {
        this.playSound(150, 'square', 0.15);
    }
    playErrorSound() {
        this.playSound(100, 'sawtooth', 0.2);
    }
    playSound(freq, type, duration) {
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
