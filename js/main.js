import { SoundEngine } from './sound.js';
import { TimerController } from './timer.js';
import { WorkoutBuilder } from './builder.js';
import { ScheduleManager } from './schedule.js';
import { WorkoutStore } from './store.js';
import { Platform } from './platform.js';

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  Platform.init();
  const sound = new SoundEngine();
  const timer = new TimerController(sound);

  const schedule = new ScheduleManager({
    onScheduleSaved: () => {
      timer.refreshTodayBanner();
      switchTab('timer');
    }
  });

  new WorkoutBuilder({
    onRunWorkout: (workout) => {
      timer.loadWorkoutPlan(workout);
      switchTab('timer');
    },
    onWorkoutsChanged: () => {
      schedule.render();
      timer.refreshTodayBanner();
    }
  });

  // Переключение вкладок
  document.getElementById('mainTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (btn) switchTab(btn.dataset.tab);
  });

  // Регистрация Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

    document.getElementById('exportBtn')?.addEventListener('click', () => {
    WorkoutStore.exportData();
  });

  const fileInput = document.getElementById('importFileInput');
  document.getElementById('importBtn')?.addEventListener('click', () => fileInput.click());
  
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    WorkoutStore.importData(file, () => {
      alert('Данные успешно загружены!');
      location.reload(); // Перезагружаем страницу, чтобы обновить все списки
    });
  });
});
