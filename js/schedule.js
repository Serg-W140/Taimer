import { WorkoutStore } from './store.js';

export class ScheduleManager {
  constructor({ onScheduleSaved }) {
    this.onScheduleSaved = onScheduleSaved;
    this.cycleSequence = new Array();

    this.#cacheDOM();
    this.#bindEvents();
    this.render();
  }

  #cacheDOM() {
    this.dom = {
      scheduleMode: document.getElementById('scheduleMode'),
      weeklySettings: document.getElementById('weeklySettings'),
      cycleSettings: document.getElementById('cycleSettings'),
      cycleGap: document.getElementById('cycleGap'),
      cycleStart: document.getElementById('cycleStart'),
      cycleWorkoutsList: document.getElementById('cycleWorkoutsList'),
      cycleAddSelect: document.getElementById('cycleAddSelect'),
      cycleAddBtn: document.getElementById('cycleAddBtn'),
      saveScheduleBtn: document.getElementById('saveScheduleBtn'),
    };
  }

  #bindEvents() {
    this.dom.scheduleMode.addEventListener('change', () => {
      const isWeekly = this.dom.scheduleMode.value === 'weekly';
      this.dom.weeklySettings.hidden = !isWeekly;
      this.dom.cycleSettings.hidden = isWeekly;
    });

    this.dom.cycleAddBtn.addEventListener('click', () => {
      const id = this.dom.cycleAddSelect.value;
      if (id) {
        this.cycleSequence.push(id);
        this.#renderCycleSequence();
      }
    });

    this.dom.cycleWorkoutsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cycle-del]');
      if (!btn) return;
      this.cycleSequence.splice(Number(btn.dataset.cycleDel), 1);
      this.#renderCycleSequence();
    });

    this.dom.saveScheduleBtn.addEventListener('click', () => this.#save());
  }

  render() {
    const schedule = WorkoutStore.getSchedule();
    const workouts = WorkoutStore.getWorkouts();

    this.dom.scheduleMode.value = schedule.mode;
    const isWeekly = schedule.mode === 'weekly';
    this.dom.weeklySettings.hidden = !isWeekly;
    this.dom.cycleSettings.hidden = isWeekly;

    const days = new Array(
      { id: 1, label: 'Понедельник' },
      { id: 2, label: 'Вторник' },
      { id: 3, label: 'Среда' },
      { id: 4, label: 'Четверг' },
      { id: 5, label: 'Пятница' },
      { id: 6, label: 'Суббота' },
      { id: 0, label: 'Воскресенье' }
    );

    const optionsHtml =
      '<option value="">— День отдыха —</option>' +
      workouts.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');

    this.dom.weeklySettings.innerHTML = days
      .map(
        (d) => `
        <div class="row">
          <label>${d.label}</label>
          <select data-day="${d.id}">${optionsHtml}</select>
        </div>`
      )
      .join('');

    days.forEach((d) => {
      const sel = this.dom.weeklySettings.querySelector(`[data-day="${d.id}"]`);
      if (sel) sel.value = schedule.weekly[d.id] || '';
    });

    this.dom.cycleGap.value = schedule.cycle.gap;
    this.dom.cycleStart.value = schedule.cycle.startDate;
    this.cycleSequence = new Array(...schedule.cycle.sequence);
    this.dom.cycleAddSelect.innerHTML = workouts
      .map((w) => `<option value="${w.id}">${w.name}</option>`)
      .join('');

    this.#renderCycleSequence();
  }

  #renderCycleSequence() {
    const workouts = WorkoutStore.getWorkouts();
    this.dom.cycleWorkoutsList.innerHTML = this.cycleSequence
      .map((id, idx) => {
        const w = workouts.find((item) => item.id === id);
        const title = w ? w.name : 'Удалённая тренировка';
        return `
          <div class="list-item">
            <span>${idx + 1}. ${title}</span>
            <button type="button" class="btn btn-danger" data-cycle-del="${idx}">✕</button>
          </div>`;
      })
      .join('');
  }

  #save() {
    const weekly = {};
    this.dom.weeklySettings.querySelectorAll('select').forEach((sel) => {
      weekly[sel.dataset.day] = sel.value;
    });

    const schedule = {
      mode: this.dom.scheduleMode.value,
      weekly,
      cycle: {
        gap: Number(this.dom.cycleGap.value),
        startDate: this.dom.cycleStart.value,
        sequence: this.cycleSequence
      }
    };

    WorkoutStore.saveSchedule(schedule);
    this.onScheduleSaved();
  }
}
