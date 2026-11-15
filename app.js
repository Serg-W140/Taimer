'use strict';

class SoundEngine {
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
      case 'gong':
        this.#playGong(now);
        break;
      case 'whistle':
        this.#playWhistle(now);
        break;
      default:
        this.#playBeep(now);
    }
  }

  #playTick(now) {
    // Короткий мягкий щелчок секундомера
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

class IntervalTimer {
  static STATUS_LABELS = {
    idle: 'ГОТОВ К СТАРТУ',
    prep: 'ПОДГОТОВКА',
    work: 'РАБОТА!',
    rest: 'ОТДЫХ',
    done: 'ТРЕНИРОВКА ОКОНЧЕНА!',
  };

  constructor() {
    this.sound = new SoundEngine();
    this.intervalId = null;
    this.wakeLock = null;
    this.isRunning = false;
    this.phase = 'idle';
    this.currentRound = 1;
    this.secondsLeft = 0;

    this.#cacheDOM();
    this.#bindEvents();
    this.reset();
  }

  #cacheDOM() {
    this.dom = {
      display: document.getElementById('display'),
      statusText: document.getElementById('statusText'),
      timeText: document.getElementById('timeText'),
      roundText: document.getElementById('roundText'),
      startBtn: document.getElementById('startBtn'),
      resetBtn: document.getElementById('resetBtn'),
      presetsContainer: document.getElementById('presetsContainer'),
      settingsForm: document.getElementById('settingsForm'),
      roundsInput: document.getElementById('roundsInput'),
      workMin: document.getElementById('workMin'),
      workSec: document.getElementById('workSec'),
      restMin: document.getElementById('restMin'),
      restSec: document.getElementById('restSec'),
      prepSec: document.getElementById('prepSec'),
      soundType: document.getElementById('soundType'),
      warnCheck: document.getElementById('warnCheck'),
      tickCheck: document.getElementById('tickCheck'),
    };
  }

  #bindEvents() {
    this.dom.startBtn.addEventListener('click', () => this.toggle());
    this.dom.resetBtn.addEventListener('click', () => this.reset());

    this.dom.presetsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      if (btn.id === 'testSoundBtn') {
        this.sound.play(this.dom.soundType.value);
        return;
      }

      if (btn.dataset.rounds) {
        this.applyPreset({
          rounds: Number(btn.dataset.rounds),
          workSec: Number(btn.dataset.work),
          restSec: Number(btn.dataset.rest),
          sound: btn.dataset.sound,
        });
      }
    });

    const liveOptions = new Array('soundType', 'warnCheck', 'tickCheck');
    this.dom.settingsForm.addEventListener('change', (e) => {
      if (!liveOptions.includes(e.target.id)) {
        this.reset();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isRunning) {
        this.#requestWakeLock();
      }
    });
  }

  async #requestWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (_) {}
    }
  }

  #releaseWakeLock() {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
  }

  getSettings() {
    const rounds = Math.max(1, parseInt(this.dom.roundsInput.value, 10) || 1);
    const work =
      (parseInt(this.dom.workMin.value, 10) || 0) * 60 +
      (parseInt(this.dom.workSec.value, 10) || 0);
    const rest =
      (parseInt(this.dom.restMin.value, 10) || 0) * 60 +
      (parseInt(this.dom.restSec.value, 10) || 0);
    const prep = Math.max(0, parseInt(this.dom.prepSec.value, 10) || 0);

    return {
      rounds,
      work: Math.max(1, work),
      rest: Math.max(0, rest),
      prep,
      sound: this.dom.soundType.value,
      warn: this.dom.warnCheck.checked,
      tick: this.dom.tickCheck.checked,
    };
  }

  toggle() {
    this.sound.init();

    if (this.isRunning) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      this.#releaseWakeLock();
      this.#setStartButtonState('Продолжить', 'btn-start');
      return;
    }

    if (this.phase === 'idle' || this.phase === 'done') {
      const settings = this.getSettings();
      this.currentRound = 1;

      if (settings.prep > 0) {
        this.phase = 'prep';
        this.secondsLeft = settings.prep;
      } else {
        this.phase = 'work';
        this.secondsLeft = settings.work;
        this.sound.play(settings.sound);
      }
    }

    this.isRunning = true;
    this.#requestWakeLock();
    this.#setStartButtonState('Пауза', 'btn-pause');
    this.#render();
    this.intervalId = setInterval(() => this.#tick(), 1000);
  }

  #tick() {
    const settings = this.getSettings();
    this.secondsLeft -= 1;

    if (this.secondsLeft <= 0) {
      this.#handlePhaseTransition(settings);
      this.#render();
      return;
    }

    // Предупреждение за 10 секунд до конца раунда
    if (
      this.phase === 'work' &&
      settings.warn &&
      this.secondsLeft === 10 &&
      settings.work > 15
    ) {
      this.sound.play(settings.sound, 'warning');
    } else if (
      // Отсчёт 3-2-1 перед началом работы
      (this.phase === 'prep' || this.phase === 'rest') &&
      this.secondsLeft <= 3
    ) {
      this.sound.play(settings.sound, 'warning');
    } else if (this.phase === 'work' && settings.tick) {
      // Тиканье секунд во время работы
      this.sound.play(settings.sound, 'tick');
    }

    this.#render();
  }

  #handlePhaseTransition(settings) {
    if (this.phase === 'prep') {
      this.phase = 'work';
      this.secondsLeft = settings.work;
      this.sound.play(settings.sound);
      return;
    }

    if (this.phase === 'work') {
      if (this.currentRound < settings.rounds) {
        if (settings.rest > 0) {
          this.phase = 'rest';
          this.secondsLeft = settings.rest;
        } else {
          this.currentRound += 1;
          this.secondsLeft = settings.work;
        }
        this.sound.play(settings.sound);
      } else {
        this.phase = 'done';
        this.secondsLeft = 0;
        this.sound.play(settings.sound);
        clearInterval(this.intervalId);
        this.isRunning = false;
        this.#releaseWakeLock();
        this.#setStartButtonState('Старт', 'btn-start');
      }
      return;
    }

    if (this.phase === 'rest') {
      this.currentRound += 1;
      this.phase = 'work';
      this.secondsLeft = settings.work;
      this.sound.play(settings.sound);
    }
  }

  reset() {
    clearInterval(this.intervalId);
    this.isRunning = false;
    this.#releaseWakeLock();
    this.phase = 'idle';
    this.currentRound = 1;
    this.secondsLeft = this.getSettings().work;
    this.#setStartButtonState('Старт', 'btn-start');
    this.#render();
  }
  applyPreset({ rounds, workSec, restSec, sound }) {
    this.dom.roundsInput.value = rounds;
    this.dom.workMin.value = Math.floor(workSec / 60);
    this.dom.workSec.value = workSec % 60;
    this.dom.restMin.value = Math.floor(restSec / 60);
    this.dom.restSec.value = restSec % 60;
    this.dom.soundType.value = sound;
    this.reset();
  }
  #setStartButtonState(text, className) {
    this.dom.startBtn.textContent = text;
    this.dom.startBtn.className = `btn ${className}`;
  }
  #formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
 }
  #render() {
    const { rounds } = this.getSettings();
    const activePhaseClass = this.phase !== 'idle' && this.phase !== 'done' ? this.phase : '';
    this.dom.display.className = `display ${activePhaseClass}`.trim();
    this.dom.statusText.textContent = IntervalTimer.STATUS_LABELS[this.phase];
    this.dom.timeText.textContent = this.#formatTime(this.secondsLeft);
    this.dom.roundText.textContent = `Раунд: ${this.currentRound} / ${rounds}`;
  }
}
document.addEventListener('DOMContentLoaded', () => {
    new IntervalTimer();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
            console.warn('Service Worker не зарегистрирован:', err);
        });
    }
});
