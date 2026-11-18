import { I18n } from './i18n.js';

export class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  speak(text, enabled) {
    if (!enabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = I18n.lang === 'ru' ? 'ru-RU' : 'en-US';
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  play(type, mode = 'main') {
    this.init();
    const now = this.ctx.currentTime;

    if (mode === 'tick') {
      this.#playTick(now);
      return;
    }
    if (mode === 'warning') {
      this.#playWarning(now);
      return;
    }

    switch (type) {
      case 'gong': this.#playGong(now); break;
      case 'whistle': this.#playWhistle(now); break;
      default: this.#playBeep(now);
    }
  }

  #playTick(now) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  #playWarning(now) {
    new Array(0, 0.15).forEach((delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now + delay);
      osc.frequency.exponentialRampToValueAtTime(300, now + delay + 0.08);
      gain.gain.setValueAtTime(0.6, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    });
  }

  #playGong(now) {
    const frequencies = new Array(260, 390, 520, 780, 1040);
    frequencies.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.45 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 2.3);
    });
  }

  #playWhistle(now) {
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2800, now);
    lfo.frequency.setValueAtTime(35, now);
    lfoGain.gain.setValueAtTime(120, now);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.75);
    lfo.stop(now + 0.75);
  }

  #playBeep(now) {
    new Array(0, 0.2, 0.4).forEach((delay) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now + delay);
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }
}
