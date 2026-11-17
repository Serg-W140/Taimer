const DEFAULT_EXERCISES = new Array(
  'Разминка',
  'Подтягивания',
  'Отжимания от пола',
  'Отжимания на брусьях',
  'Приседания',
  'Выпады',
  'Планка',
  'Скручивания на пресс',
  'Бёрпи',
  'Скакалка',
  'Бой с тенью',
  'Работа на мешке',
  'Заминка и растяжка'
);

const DEFAULT_WORKOUTS = new Array(
  {
    id: 'w_base_1',
    name: 'База: Турник и отжимания',
    steps: new Array(
      { name: 'Разминка', sets: 1, work: 180, rest: 0, afterRest: 30 },
      { name: 'Подтягивания', sets: 4, work: 20, rest: 40, afterRest: 60 },
      { name: 'Отжимания от пола', sets: 4, work: 30, rest: 30, afterRest: 60 },
      { name: 'Планка', sets: 3, work: 45, rest: 30, afterRest: 30 },
      { name: 'Заминка и растяжка', sets: 1, work: 120, rest: 0, afterRest: 0 }
    )
  },
  {
    id: 'w_box_1',
    name: 'Бокс: Раунды и СФП',
    steps: new Array(
      { name: 'Скакалка', sets: 2, work: 120, rest: 30, afterRest: 60 },
      { name: 'Бой с тенью', sets: 3, work: 180, rest: 60, afterRest: 60 },
      { name: 'Бёрпи', sets: 4, work: 20, rest: 20, afterRest: 40 },
      { name: 'Заминка и растяжка', sets: 1, work: 120, rest: 0, afterRest: 0 }
    )
  }
);

export class WorkoutStore {
  static KEYS = {
    EXERCISES: 'fit_exercises_v1',
    WORKOUTS: 'fit_workouts_v1',
    SCHEDULE: 'fit_schedule_v1',
  };

  static getExercises() {
    const saved = localStorage.getItem(this.KEYS.EXERCISES);
    return saved ? JSON.parse(saved) : DEFAULT_EXERCISES;
  }

  static addExercise(name) {
    const clean = name.trim();
    if (!clean) return;
    const list = this.getExercises();
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(this.KEYS.EXERCISES, JSON.stringify(list));
    }
  }

  static getWorkouts() {
    const saved = localStorage.getItem(this.KEYS.WORKOUTS);
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUTS;
  }

  static saveWorkouts(list) {
    localStorage.setItem(this.KEYS.WORKOUTS, JSON.stringify(list));
  }

  static getLocalDateStr(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static getSchedule() {
    const saved = localStorage.getItem(this.KEYS.SCHEDULE);
    if (saved) return JSON.parse(saved);

    return {
      mode: 'weekly',
      weekly: {
        1: 'w_base_1',
        2: '',
        3: 'w_box_1',
        4: '',
        5: 'w_base_1',
        6: '',
        0: ''
      },
      cycle: {
        gap: 2,
        startDate: this.getLocalDateStr(),
        sequence: ['w_base_1', 'w_box_1']
      }
    };
  }

  static saveSchedule(schedule) {
    localStorage.setItem(this.KEYS.SCHEDULE, JSON.stringify(schedule));
  }

  static getTodayWorkout() {
    const schedule = this.getSchedule();
    const workouts = this.getWorkouts();
    const today = new Date();
    let targetId = '';

    if (schedule.mode === 'weekly') {
      targetId = schedule.weekly[today.getDay()] || '';
    } else if (schedule.mode === 'cycle' && schedule.cycle.sequence.length > 0) {
      const start = new Date(schedule.cycle.startDate + 'T00:00:00');
      //const now = new Date(today.toISOString().split('T')[0] + 'T00:00:00');
      const now = new Date(this.getLocalDateStr(today) + 'T00:00:00');
      //
      const diffDays = Math.floor((now - start) / 86400000);

      if (diffDays >= 0 && diffDays % schedule.cycle.gap === 0) {
        const index = (diffDays / schedule.cycle.gap) % schedule.cycle.sequence.length;
        targetId = schedule.cycle.sequence[index];
      }
    }

    return workouts.find((w) => w.id === targetId) || null;
  }

    static exportData() {
    const data = {
      exercises: this.getExercises(),
      workouts: this.getWorkouts(),
      schedule: this.getSchedule()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `timer-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  static importData(file, onSuccess) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.exercises) localStorage.setItem(this.KEYS.EXERCISES, JSON.stringify(data.exercises));
        if (data.workouts) this.saveWorkouts(data.workouts);
        if (data.schedule) this.saveSchedule(data.schedule);
        onSuccess();
      } catch (err) {
        alert('Ошибка: повреждённый или неверный файл.');
      }
    };
    reader.readAsText(file);
  }

}
