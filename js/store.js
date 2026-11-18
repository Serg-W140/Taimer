import { Platform } from "./platform";

const DEFAULT_EXERCISES = [
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
];

const DEFAULT_WORKOUTS = [
  {
    id: 'w_base_1',
    name: 'База: Турник и отжимания',
    steps: [
      { name: 'Разминка', sets: 1, work: 180, rest: 0, afterRest: 30 },
      { name: 'Подтягивания', sets: 4, work: 20, rest: 40, afterRest: 60 },
      { name: 'Отжимания от пола', sets: 4, work: 30, rest: 30, afterRest: 60 },
      { name: 'Планка', sets: 3, work: 45, rest: 30, afterRest: 30 },
      { name: 'Заминка и растяжка', sets: 1, work: 120, rest: 0, afterRest: 0 }
    ]
  },
  {
    id: 'w_box_1',
    name: 'Бокс: Раунды и СФП',
    steps: [
      { name: 'Скакалка', sets: 2, work: 120, rest: 30, afterRest: 60 },
      { name: 'Бой с тенью', sets: 3, work: 180, rest: 60, afterRest: 60 },
      { name: 'Бёрпи', sets: 4, work: 20, rest: 20, afterRest: 40 },
      { name: 'Заминка и растяжка', sets: 1, work: 120, rest: 0, afterRest: 0 }
    ]
  }
];

export class WorkoutStore {
  static KEYS = {
    EXERCISES: 'fit_exercises_v1',
    WORKOUTS: 'fit_workouts_v1',
    SCHEDULE: 'fit_schedule_v1',
  };

  static getLocalDateStr(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

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
      const json = JSON.stringify(list);
      localStorage.setItem(this.KEYS.EXERCISES, json);
      Platform.saveCloud(this.KEYS.EXERCISES, json);
    }
  }

  static getWorkouts() {
    const saved = localStorage.getItem(this.KEYS.WORKOUTS);
    return saved ? JSON.parse(saved) : DEFAULT_WORKOUTS;
  }

  static saveWorkouts(list) {
    const json = JSON.stringify(list);
    localStorage.setItem(this.KEYS.WORKOUTS, json);
    Platform.saveCloud(this.KEYS.WORKOUTS, json);
  }

  static getSchedule() {
    const saved = localStorage.getItem(this.KEYS.SCHEDULE);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Миграция старого формата данных в новый (массивы слотов со временем)
      if (parsed.weekly) {
        for (let d = 0; d <= 6; d += 1) {
          if (typeof parsed.weekly[d] === 'string') {
            parsed.weekly[d] = parsed.weekly[d]
              ? [{ workoutId: parsed.weekly[d], time: '19:00' }]
              : [];
          } else if (!Array.isArray(parsed.weekly[d])) {
            parsed.weekly[d] = [];
          }
        }
      }
      if (parsed.cycle && Array.isArray(parsed.cycle.sequence)) {
        parsed.cycle.sequence = parsed.cycle.sequence.map((item) => {
          if (typeof item === 'string') {
            return [{ workoutId: item, time: '19:00' }];
          }
          return Array.isArray(item) ? item : [];
        });
      }
      if (typeof parsed.remind !== 'number') parsed.remind = 30;
      return parsed;
    }

    return {
      mode: 'weekly',
      remind: 30,
      weekly: {
        1: [{ workoutId: 'w_base_1', time: '19:00' }],
        2: [],
        3: [{ workoutId: 'w_box_1', time: '19:00' }],
        4: [],
        5: [{ workoutId: 'w_base_1', time: '19:00' }],
        6: [],
        0: []
      },
      cycle: {
        gap: 2,
        startDate: this.getLocalDateStr(),
        sequence: [
          [{ workoutId: 'w_base_1', time: '19:00' }],
          [{ workoutId: 'w_box_1', time: '19:00' }]
        ]
      }
    };
  }

  static saveSchedule(schedule) {
    const json = JSON.stringify(schedule);
    localStorage.setItem(this.KEYS.SCHEDULE, json);
    Platform.saveCloud(this.KEYS.SCHEDULE, json);
  }

  // Синхронизация при старте приложения в Telegram
  static async syncFromCloud() {
    if (!Platform.isTelegram) return false;

    const keys = Object.values(this.KEYS);
    const cloudData = await Platform.loadCloud(keys);
    if (!cloudData) return false;

    let hasChanges = false;
    keys.forEach((key) => {
      const remoteVal = cloudData[key];
      const localVal = localStorage.getItem(key);
      if (remoteVal && remoteVal !== localVal) {
        localStorage.setItem(key, remoteVal);
        hasChanges = true;
      } else if (!remoteVal && localVal) {
        // Если в облаке пусто, а локально уже есть данные — выгружаем их в облако
        Platform.saveCloud(key, localVal);
      }
    });

    return hasChanges;
  }

  // Возвращает массив объектов: [{ time: '08:00', workout: {...} }, ...]
  static getTodayWorkouts() {
    const schedule = this.getSchedule();
    const workouts = this.getWorkouts();
    const today = new Date();
    let slots = [];

    if (schedule.mode === 'weekly') {
      slots = schedule.weekly[today.getDay()] || [];
    } else if (schedule.mode === 'cycle' && schedule.cycle.sequence.length > 0) {
      const start = new Date(schedule.cycle.startDate + 'T00:00:00');
      const now = new Date(this.getLocalDateStr(today) + 'T00:00:00');
      const diffDays = Math.floor((now - start) / 86400000);

      if (diffDays >= 0 && diffDays % schedule.cycle.gap === 0) {
        const index = (diffDays / schedule.cycle.gap) % schedule.cycle.sequence.length;
        slots = schedule.cycle.sequence[index] || [];
      }
    }

    return slots
      .map((slot) => ({
        time: slot.time || '19:00',
        workout: workouts.find((w) => w.id === slot.workoutId) || null
      }))
      .filter((item) => item.workout !== null)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  static #calcWorkoutDurationSec(workout) {
    return workout.steps.reduce((acc, s, i) => {
      const work = s.sets * s.work;
      const rest = Math.max(0, s.sets - 1) * s.rest;
      const after = i < workout.steps.length - 1 ? s.afterRest : 0;
      return acc + work + rest + after;
    }, 300); // +5 мин запаса на подготовку
  }

  static downloadCalendarEvents() {
    const schedule = this.getSchedule();
    const workouts = this.getWorkouts();
    const remindMin = Number(schedule.remind) || 30;
    const now = new Date();
    const events = [];

    const pad = (n) => String(n).padStart(2, '0');
    const formatICSDate = (d) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

    const buildEventBlock = (startDate, durationSec, title, rrule, uidSuffix) => {
      const endDate = new Date(startDate.getTime() + durationSec * 1000);
      return [
        'BEGIN:VEVENT',
        `UID:workout-${Date.now()}-${uidSuffix}@intervaltimer`,
        `DTSTAMP:${formatICSDate(now)}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:Тренировка: ${title}`,
        'DESCRIPTION:Запуск интервального таймера по расписанию.',
        rrule,
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Напоминание о тренировке',
        `TRIGGER:-PT${remindMin}M`,
        'END:VALARM',
        'END:VEVENT'
      ].filter(Boolean).join('\r\n');
    };

    if (schedule.mode === 'weekly') {
      const dayMap = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
      for (let dayIdx = 0; dayIdx <= 6; dayIdx += 1) {
        const daySlots = schedule.weekly[dayIdx] || [];
        daySlots.forEach((slot, sIdx) => {
          const w = workouts.find((item) => item.id === slot.workoutId);
          if (!w) return;

          const [hh, mm] = (slot.time || '19:00').split(':').map(Number);
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
          // Ищем ближайший подходящий день недели
          const diff = (dayIdx - start.getDay() + 7) % 7;
          start.setDate(start.getDate() + diff);
          if (start < now) start.setDate(start.getDate() + 7);

          const rrule = `RRULE:FREQ=WEEKLY;BYDAY=${dayMap[dayIdx]}`;
          events.push(buildEventBlock(start, this.#calcWorkoutDurationSec(w), w.name, rrule, `w${dayIdx}-${sIdx}`));
        });
      }
    } else if (schedule.mode === 'cycle') {
      const seq = schedule.cycle.sequence || [];
      const gap = Math.max(1, Number(schedule.cycle.gap) || 2);
      const totalCycleDays = seq.length * gap;
      const baseStart = new Date(schedule.cycle.startDate + 'T00:00:00');

      seq.forEach((daySlots, dayOffset) => {
        daySlots.forEach((slot, sIdx) => {
          const w = workouts.find((item) => item.id === slot.workoutId);
          if (!w) return;

          const [hh, mm] = (slot.time || '19:00').split(':').map(Number);
          const start = new Date(baseStart);
          start.setDate(start.getDate() + dayOffset * gap);
          start.setHours(hh, mm, 0, 0);

          while (start < now) {
            start.setDate(start.getDate() + totalCycleDays);
          }

          const rrule = `RRULE:FREQ=DAILY;INTERVAL=${totalCycleDays}`;
          events.push(buildEventBlock(start, this.#calcWorkoutDurationSec(w), w.name, rrule, `c${dayOffset}-${sIdx}`));
        });
      });
    }

    if (events.length === 0) {
      alert('В графике пока нет ни одной запланированной тренировки.');
      return;
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Interval Timer//RU',
      ...events,
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workouts-schedule.ics';
    a.click();
    URL.revokeObjectURL(url);
  }
}
