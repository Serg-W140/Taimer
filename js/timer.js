import { WorkoutStore } from './store.js';

export class TimerController {
  constructor(soundEngine) {
    this.sound = soundEngine;
    this.intervalId = null;
    this.wakeLock = null;
    this.isRunning = false;

    this.queue = new Array();
    this.currentIndex = 0;
    this.secondsLeft = 0;
    this.activeWorkoutName = 'Свободный режим';

    this.#cacheDOM();
    this.#bindEvents();
    this.refreshTodayBanner();
    this.loadFreeMode();
  }

  #cacheDOM() {
    this.dom = {
      todayWorkoutsList: document.getElementById('todayWorkoutsList'),
      display: document.getElementById('display'),
      exerciseTitle: document.getElementById('exerciseTitle'),
      statusText: document.getElementById('statusText'),
      timeText: document.getElementById('timeText'),
      roundText: document.getElementById('roundText'),
      nextText: document.getElementById('nextText'),
      startBtn: document.getElementById('startBtn'),
      resetBtn: document.getElementById('resetBtn'),
      presetsContainer: document.getElementById('presetsContainer'),
      quickSettings: document.getElementById('quickSettings'),
      roundsInput: document.getElementById('roundsInput'),
      workMin: document.getElementById('workMin'),
      workSec: document.getElementById('workSec'),
      restMin: document.getElementById('restMin'),
      restSec: document.getElementById('restSec'),
      prepSec: document.getElementById('prepSec'),
      soundType: document.getElementById('soundType'),
      voiceCheck: document.getElementById('voiceCheck'),
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
        this.dom.roundsInput.value = btn.dataset.rounds;
        this.dom.workMin.value = Math.floor(Number(btn.dataset.work) / 60);
        this.dom.workSec.value = Number(btn.dataset.work) % 60;
        this.dom.restMin.value = Math.floor(Number(btn.dataset.rest) / 60);
        this.dom.restSec.value = Number(btn.dataset.rest) % 60;
        this.dom.soundType.value = btn.dataset.sound;
        this.loadFreeMode();
      }
    });

    this.dom.quickSettings.addEventListener('change', () => this.loadFreeMode());

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isRunning) {
        this.#requestWakeLock();
      }
    });
  }

  refreshTodayBanner() {
    const container = this.dom.todayWorkoutsList;
    if (!container) return;

    const todayList = WorkoutStore.getTodayWorkouts();
    if (todayList.length === 0) {
      container.innerHTML = '<strong>День отдыха или свободный режим</strong>';
      return;
    }

    container.innerHTML = todayList
      .map(
        (item, idx) => `
        <div class="row">
          <span><strong>${item.time}</strong> — ${item.workout.name}</span>
          <button type="button" class="btn btn-accent btn-sm" data-today-idx="${idx}">Загрузить</button>
        </div>`
      )
      .join('');

    container.querySelectorAll('[data-today-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const selected = todayList[Number(btn.dataset.todayIdx)];
        if (selected) this.loadWorkoutPlan(selected.workout);
      });
    });
  }

  refreshTodayBanner() {
  const container = document.getElementById('todayWorkoutsList');
  if (!container) return;

  const todayList = WorkoutStore.getTodayWorkouts();
  if (todayList.length === 0) {
    container.innerHTML = '<strong>День отдыха или свободный режим</strong>';
    return;
  }

  container.innerHTML = todayList
    .map(
      (item, idx) => `
      <div class="row">
        <span><strong>${item.time}</strong> — ${item.workout.name}</span>
        <button type="button" class="btn btn-accent btn-sm" data-today-idx="${idx}">Загрузить</button>
      </div>`
    )
    .join('');

  container.querySelectorAll('[data-today-idx]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = todayList[Number(btn.dataset.todayIdx)];
      if (selected) this.loadWorkoutPlan(selected.workout);
    });
  });
}


  #buildQueue(workoutName, steps) {
    const queue = new Array();
    const prep = Math.max(0, parseInt(this.dom.prepSec.value, 10) || 0);

    if (prep > 0 && steps.length > 0) {
      queue.push({
        phase: 'prep',
        title: workoutName,
        status: 'ПОДГОТОВКА',
        duration: prep,
        roundInfo: `Первое: ${steps[0].name}`,
        speak: `Подготовка. Первое упражнение: ${steps[0].name}`
      });
    }

    steps.forEach((step, stepIdx) => {
      for (let s = 1; s <= step.sets; s += 1) {
        queue.push({
          phase: 'work',
          title: step.name,
          status: 'РАБОТА!',
          duration: step.work,
          roundInfo: `Подход: ${s} / ${step.sets}`,
          speak: `${step.name}. Подход ${s}`
        });

        if (s < step.sets && step.rest > 0) {
          queue.push({
            phase: 'rest',
            title: step.name,
            status: 'ОТДЫХ',
            duration: step.rest,
            roundInfo: `Далее подход: ${s + 1} / ${step.sets}`,
            speak: 'Отдых'
          });
        }
      }

      const nextStep = steps[stepIdx + 1];
      if (nextStep && step.afterRest > 0) {
        queue.push({
          phase: 'rest',
          title: `Далее: ${nextStep.name}`,
          status: 'СМЕНА УПРАЖНЕНИЯ',
          duration: step.afterRest,
          roundInfo: `Упражнение ${stepIdx + 2} из ${steps.length}`,
          speak: `Перерыв. Следующее упражнение: ${nextStep.name}`
        });
      }
    });

    return queue;
  }

  loadFreeMode() {
    this.stop();
    this.activeWorkoutName = 'Свободный режим';
    this.dom.quickSettings.hidden = false;

    const rounds = Math.max(1, parseInt(this.dom.roundsInput.value, 10) || 1);
    const work = Math.max(1, (parseInt(this.dom.workMin.value, 10) || 0) * 60 + (parseInt(this.dom.workSec.value, 10) || 0));
    const rest = Math.max(0, (parseInt(this.dom.restMin.value, 10) || 0) * 60 + (parseInt(this.dom.restSec.value, 10) || 0));

    const freeSteps = new Array({
      name: 'Свободный раунд',
      sets: rounds,
      work,
      rest,
      afterRest: 0
    });

    this.queue = this.#buildQueue('Свободный режим', freeSteps);
    this.currentIndex = 0;
    this.secondsLeft = this.queue[0].duration;
    this.#renderIdle();
  }

  loadWorkoutPlan(workout) {
    this.stop();
    this.activeWorkoutName = workout.name;
    this.dom.quickSettings.hidden = true;
    this.queue = this.#buildQueue(workout.name, workout.steps);
    this.currentIndex = 0;
    this.secondsLeft = this.queue[0].duration;
    this.#renderIdle();
  }

  toggle() {
    this.sound.init();

    if (this.isRunning) {
      clearInterval(this.intervalId);
      this.isRunning = false;
      this.#releaseWakeLock();
      this.#setStartBtn('Продолжить', 'btn-start');
      return;
    }

    if (this.currentIndex >= this.queue.length) {
      this.currentIndex = 0;
      this.secondsLeft = this.queue[0].duration;
    }

    if (this.secondsLeft === this.queue[this.currentIndex].duration && this.currentIndex === 0) {
      const seg = this.queue[0];
      if (seg.phase === 'work') {
        this.sound.play(this.dom.soundType.value);
      }
      this.sound.speak(seg.speak, this.dom.voiceCheck.checked);
    }

    this.isRunning = true;
    this.#requestWakeLock();
    this.#setStartBtn('Пауза', 'btn-pause');
    this.#renderActive();
    this.intervalId = setInterval(() => this.#tick(), 1000);
  }

  stop() {
    clearInterval(this.intervalId);
    this.isRunning = false;
    this.#releaseWakeLock();
    this.#setStartBtn('Старт', 'btn-start');
  }

  reset() {
    this.stop();
    this.currentIndex = 0;
    this.secondsLeft = this.queue ? this.queue[0].duration : 0;
    this.#renderIdle();
  }

  #tick() {
    const soundType = this.dom.soundType.value;
    const warn = this.dom.warnCheck.checked;
    const tick = this.dom.tickCheck.checked;
    const seg = this.queue[this.currentIndex];

    this.secondsLeft -= 1;

    if (this.secondsLeft <= 0) {
      this.currentIndex += 1;

      if (this.currentIndex >= this.queue.length) {
        this.stop();
        this.sound.play(soundType);
        this.sound.speak('Тренировка окончена! Отличная работа!', this.dom.voiceCheck.checked);
        this.dom.display.className = 'display';
        this.dom.statusText.textContent = 'ТРЕНИРОВКА ОКОНЧЕНА!';
        this.dom.timeText.textContent = '00:00';
        this.dom.nextText.textContent = '';
        return;
      }

      const nextSeg = this.queue[this.currentIndex];
      this.secondsLeft = nextSeg.duration;
      this.sound.play(soundType);
      this.sound.speak(nextSeg.speak, this.dom.voiceCheck.checked);
      this.#renderActive();
      return;
    }

    if (seg.phase === 'work' && warn && this.secondsLeft === 10 && seg.duration > 15) {
      this.sound.play(soundType, 'warning');
    } else if ((seg.phase === 'prep' || seg.phase === 'rest') && this.secondsLeft <= 3) {
      this.sound.play(soundType, 'warning');
    } else if (seg.phase === 'work' && tick) {
      this.sound.play(soundType, 'tick');
    }

    this.#renderActive();
  }

  #renderIdle() {
    const first = this.queue[0];
    this.dom.display.className = 'display';
    this.dom.exerciseTitle.textContent = this.activeWorkoutName;
    this.dom.statusText.textContent = 'ГОТОВ К СТАРТУ';
    this.dom.timeText.textContent = this.#formatTime(first.duration);
    this.dom.roundText.textContent = first.roundInfo;
    this.dom.nextText.textContent = this.queue[1] ? `Затем: ${this.queue[1].title}` : '';
  }

  #renderActive() {
    const seg = this.queue[this.currentIndex];
    const nextSeg = this.queue[this.currentIndex + 1];

    this.dom.display.className = `display ${seg.phase}`;
    this.dom.exerciseTitle.textContent = seg.title;
    this.dom.statusText.textContent = seg.status;
    this.dom.timeText.textContent = this.#formatTime(this.secondsLeft);
    this.dom.roundText.textContent = seg.roundInfo;
    this.dom.nextText.textContent = nextSeg ? `Далее: ${nextSeg.title} (${nextSeg.status.toLowerCase()})` : 'Финишный этап';
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

  #setStartBtn(text, cls) {
    this.dom.startBtn.textContent = text;
    this.dom.startBtn.className = `btn ${cls}`;
  }

  #formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
    }
}
