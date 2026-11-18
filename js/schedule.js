import { WorkoutStore } from './store.js';

export class ScheduleManager {
  constructor({ onScheduleSaved }) {
    this.onScheduleSaved = onScheduleSaved;
    this.weeklyDraft = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    this.cycleSequence = [];

    this.#cacheDOM();
    this.#bindEvents();
    this.render();
  }

  #cacheDOM() {
    this.dom = {
      scheduleMode: document.getElementById('scheduleMode'),
      remindBefore: document.getElementById('remindBefore'),
      weeklySettings: document.getElementById('weeklySettings'),
      cycleSettings: document.getElementById('cycleSettings'),
      cycleGap: document.getElementById('cycleGap'),
      cycleStart: document.getElementById('cycleStart'),
      cycleDaySlot: document.getElementById('cycleDaySlot'),
      cycleTimeInput: document.getElementById('cycleTimeInput'),
      cycleAddSelect: document.getElementById('cycleAddSelect'),
      cycleAddBtn: document.getElementById('cycleAddBtn'),
      cycleWorkoutsList: document.getElementById('cycleWorkoutsList'),
      saveScheduleBtn: document.getElementById('saveScheduleBtn'),
      addToCalendarBtn: document.getElementById('addToCalendarBtn'),
    };
  }

  #bindEvents() {
    this.dom.scheduleMode.addEventListener('change', () => {
      const isWeekly = this.dom.scheduleMode.value === 'weekly';
      this.dom.weeklySettings.hidden = !isWeekly;
      this.dom.cycleSettings.hidden = isWeekly;
    });

    // Добавление / удаление слота в режиме "По дням недели"
    this.dom.weeklySettings.addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-week-add]');
      const delBtn = e.target.closest('[data-week-del]');

      if (addBtn) {
        const day = Number(addBtn.dataset.weekAdd);
        const card = addBtn.closest('.day-card');
        const time = card.querySelector('.week-time-input').value || '19:00';
        const workoutId = card.querySelector('.week-workout-select').value;
        if (!workoutId) return;

        this.weeklyDraft[day].push({ workoutId, time });
        this.weeklyDraft[day].sort((a, b) => a.time.localeCompare(b.time));
        this.#renderWeekly();
      }

      if (delBtn) {
        const day = Number(delBtn.dataset.weekDay);
        const idx = Number(delBtn.dataset.weekDel);
        this.weeklyDraft[day].splice(idx, 1);
        this.#renderWeekly();
      }
    });

    // Добавление слота в режим "Цикл"
    this.dom.cycleAddBtn.addEventListener('click', () => {
      const dayIdx = Number(this.dom.cycleDaySlot.value);
      const time = this.dom.cycleTimeInput.value || '19:00';
      const workoutId = this.dom.cycleAddSelect.value;
      if (!workoutId) return;

      while (this.cycleSequence.length <= dayIdx) {
        this.cycleSequence.push([]);
      }
      this.cycleSequence[dayIdx].push({ workoutId, time });
      this.cycleSequence[dayIdx].sort((a, b) => a.time.localeCompare(b.time));
      this.#renderCycleSequence();
    });

    // Удаление слота из цикла
    this.dom.cycleWorkoutsList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cycle-del]');
      if (!btn) return;
      const dayIdx = Number(btn.dataset.cycleDay);
      const slotIdx = Number(btn.dataset.cycleDel);
      this.cycleSequence[dayIdx].splice(slotIdx, 1);
      // Убираем пустые дни с конца массива
      while (this.cycleSequence.length > 0 && this.cycleSequence[this.cycleSequence.length - 1].length === 0) {
        this.cycleSequence.pop();
      }
      this.#renderCycleSequence();
    });

    this.dom.saveScheduleBtn.addEventListener('click', () => this.#save(true));

    this.dom.addToCalendarBtn?.addEventListener('click', () => {
      this.#save(false);
      WorkoutStore.downloadCalendarEvents();
    });
  }

  render() {
    const schedule = WorkoutStore.getSchedule();
    const workouts = WorkoutStore.getWorkouts();

    this.dom.scheduleMode.value = schedule.mode;
    this.dom.remindBefore.value = schedule.remind ?? 30;

    const isWeekly = schedule.mode === 'weekly';
    this.dom.weeklySettings.hidden = !isWeekly;
    this.dom.cycleSettings.hidden = isWeekly;

    // Копируем расписание в локальный черновик
    for (let d = 0; d <= 6; d += 1) {
      this.weeklyDraft[d] = (schedule.weekly[d] || []).map((s) => ({ ...s }));
    }
    this.cycleSequence = (schedule.cycle.sequence || []).map((dayArr) => dayArr.map((s) => ({ ...s })));

    this.dom.cycleGap.value = schedule.cycle.gap;
    this.dom.cycleStart.value = schedule.cycle.startDate;
    this.dom.cycleAddSelect.innerHTML = workouts
      .map((w) => `<option value="${w.id}">${w.name}</option>`)
      .join('');

    this.#renderWeekly();
    this.#renderCycleSequence();
  }

  #renderWeekly() {
    const workouts = WorkoutStore.getWorkouts();
    const optionsHtml = workouts.map((w) => `<option value="${w.id}">${w.name}</option>`).join('');

    const days = [
      { id: 1, label: 'Понедельник' },
      { id: 2, label: 'Вторник' },
      { id: 3, label: 'Среда' },
      { id: 4, label: 'Четверг' },
      { id: 5, label: 'Пятница' },
      { id: 6, label: 'Суббота' },
      { id: 0, label: 'Воскресенье' }
    ];

    this.dom.weeklySettings.innerHTML = days
      .map((d) => {
        const slots = this.weeklyDraft[d.id] || [];
        const slotsHtml = slots.length
          ? slots
              .map((s, idx) => {
                const w = workouts.find((item) => item.id === s.workoutId);
                const title = w ? w.name : 'Удалённая тренировка';
                return `
                  <div class="list-item" style="padding: 6px 10px;">
                    <span><strong>${s.time}</strong> — ${title}</span>
                    <button type="button" class="btn btn-danger btn-xs" data-week-day="${d.id}" data-week-del="${idx}">✕</button>
                  </div>`;
              })
              .join('')
          : '<small style="color:#777;">День отдыха</small>';

        return `
          <div class="step-adder day-card" style="gap: 8px;">
            <strong style="font-size: 0.95rem;">${d.label}</strong>
            ${slotsHtml}
            <div class="row" style="margin-top: 4px;">
              <input type="time" class="week-time-input" value="19:00">
              <select class="week-workout-select">${optionsHtml}</select>
              <button type="button" class="btn btn-preset btn-sm" data-week-add="${d.id}">+</button>
            </div>
          </div>`;
      })
      .join('');
  }

  #renderCycleSequence() {
    const workouts = WorkoutStore.getWorkouts();
    if (this.cycleSequence.length === 0) {
      this.dom.cycleWorkoutsList.innerHTML = '<small style="color:#888;">В цикле пока нет тренировок</small>';
      return;
    }

    this.dom.cycleWorkoutsList.innerHTML = this.cycleSequence
      .map((daySlots, dayIdx) => {
        if (!daySlots || daySlots.length === 0) {
          return `<div class="list-item"><small>Тренировочный день ${dayIdx + 1}: пусто</small></div>`;
        }
        const itemsHtml = daySlots
          .map((s, slotIdx) => {
            const w = workouts.find((item) => item.id === s.workoutId);
            const title = w ? w.name : 'Удалённая тренировка';
            return `
              <div class="row" style="margin-top: 4px;">
                <span><strong>${s.time}</strong> — ${title}</span>
                <button type="button" class="btn btn-danger btn-xs" data-cycle-day="${dayIdx}" data-cycle-del="${slotIdx}">✕</button>
              </div>`;
          })
          .join('');

        return `
          <div class="step-adder" style="gap: 4px;">
            <small style="color: var(--accent); font-weight: 700;">Тренировочный день ${dayIdx + 1}</small>
            ${itemsHtml}
          </div>`;
      })
      .join('');
  }

  #save(switchAfter = true) {
    const schedule = {
      mode: this.dom.scheduleMode.value,
      remind: Number(this.dom.remindBefore.value) || 0,
      weekly: this.weeklyDraft,
      cycle: {
        gap: Number(this.dom.cycleGap.value) || 2,
        startDate: this.dom.cycleStart.value,
        sequence: this.cycleSequence
      }
    };

    WorkoutStore.saveSchedule(schedule);
    if (switchAfter) this.onScheduleSaved();
  }
}
