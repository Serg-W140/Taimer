import { SoundEngine } from './sound.js';
import { TimerController } from './timer.js';
import { WorkoutBuilder } from './builder.js';
import { ScheduleManager } from './schedule.js';
import { WorkoutStore } from './store.js';
import { Platform } from './platform.js';
import { I18n } from './i18n.js';
import { DICT } from './dict.js';

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach((content) => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  Platform.init();
  I18n.setDict(DICT);
  I18n.init();

  const sound = new SoundEngine();
  const timer = new TimerController(sound);

  const schedule = new ScheduleManager({
    onScheduleSaved: () => {
      timer.refreshTodayBanner();
      switchTab('timer');
    }
  });

  const builder = new WorkoutBuilder({
    onRunWorkout: (workout) => {
      timer.loadWorkoutPlan(workout);
      switchTab('timer');
    },
    onWorkoutsChanged: () => {
      schedule.render();
      timer.refreshTodayBanner();
    }
  });

  document.getElementById('langToggleBtn')?.addEventListener('click', () => {
    I18n.toggle();
    builder.renderExerciseOptions();
    builder.renderDraftSteps();
    builder.renderSavedWorkouts();
    schedule.render();
    timer.refreshTodayBanner();
    if (!timer.isRunning) timer.loadFreeMode();
  });

  const updatedFromCloud = await WorkoutStore.syncFromCloud();
  if (updatedFromCloud) {
    builder.renderExerciseOptions();
    builder.renderSavedWorkouts();
    schedule.render();
    timer.refreshTodayBanner();
  }

  document.getElementById('mainTabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.tab-btn');
    if (btn) switchTab(btn.dataset.tab);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }

  const helpModal = document.getElementById('helpModal');
  document.getElementById('helpBtn')?.addEventListener('click', () => {
    helpModal.hidden = false;
  });
  document.getElementById('closeHelpBtn')?.addEventListener('click', () => {
    helpModal.hidden = true;
  });
  helpModal?.addEventListener('click', (e) => {
    if (e.target === helpModal) helpModal.hidden = true;
  });

});
