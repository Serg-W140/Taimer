import { WorkoutStore } from './store.js';
import { I18n } from './i18n.js';

export class WorkoutBuilder {
  constructor({ onRunWorkout, onWorkoutsChanged }) {
    this.onRunWorkout = onRunWorkout;
    this.onWorkoutsChanged = onWorkoutsChanged;
    this.draftSteps = [];
    this.editingId = null;

    this.#cacheDOM();
    this.#bindEvents();
    this.renderExerciseOptions();
    this.renderSavedWorkouts();
    this.renderDraftSteps();
  }

  #cacheDOM() {
    this.dom = {
      savedWorkoutsList: document.getElementById('savedWorkoutsList'),
      workoutNameInput: document.getElementById('workoutNameInput'),
      exerciseSelect: document.getElementById('exerciseSelect'),
      customExRow: document.getElementById('customExRow'),
      customExInput: document.getElementById('customExInput'),
      stepSets: document.getElementById('stepSets'),
      stepWork: document.getElementById('stepWork'),
      stepRest: document.getElementById('stepRest'),
      stepAfterRest: document.getElementById('stepAfterRest'),
      addStepBtn: document.getElementById('addStepBtn'),
      draftStepsList: document.getElementById('draftStepsList'),
      saveWorkoutBtn: document.getElementById('saveWorkoutBtn'),
    };

    this.dom.cancelEditBtn = document.createElement('button');
    this.dom.cancelEditBtn.type = 'button';
    this.dom.cancelEditBtn.className = 'btn btn-reset full-btn';
    this.dom.cancelEditBtn.textContent = I18n.t('btnCancelEdit');
    this.dom.cancelEditBtn.hidden = true;
    this.dom.saveWorkoutBtn.after(this.dom.cancelEditBtn);
  }

  #bindEvents() {
    this.dom.exerciseSelect.addEventListener('change', () => {
      this.dom.customExRow.hidden = this.dom.exerciseSelect.value !== '__custom__';
    });

    this.dom.addStepBtn.addEventListener('click', () => this.#addDraftStep());
    this.dom.cancelEditBtn.addEventListener('click', () => this.#resetForm());

    this.dom.draftStepsList.addEventListener('click', (e) => {
      const delBtn = e.target.closest('[data-del-idx]');
      const editStepBtn = e.target.closest('[data-edit-step-idx]');
      const upBtn = e.target.closest('[data-up-idx]');
      const downBtn = e.target.closest('[data-down-idx]');

      if (delBtn) {
        this.draftSteps.splice(Number(delBtn.dataset.delIdx), 1);
        this.renderDraftSteps();
      } else if (editStepBtn) {
        this.#loadStepToForm(Number(editStepBtn.dataset.editStepIdx));
      } else if (upBtn) {
        const idx = Number(upBtn.dataset.upIdx);
        if (idx > 0) {
          [this.draftSteps[idx - 1], this.draftSteps[idx]] = [this.draftSteps[idx], this.draftSteps[idx - 1]];
          this.renderDraftSteps();
        }
      } else if (downBtn) {
        const idx = Number(downBtn.dataset.downIdx);
        if (idx < this.draftSteps.length - 1) {
          [this.draftSteps[idx + 1], this.draftSteps[idx]] = [this.draftSteps[idx], this.draftSteps[idx + 1]];
          this.renderDraftSteps();
        }
      }
    });

    this.dom.saveWorkoutBtn.addEventListener('click', () => this.#saveWorkout());

    this.dom.savedWorkoutsList.addEventListener('click', (e) => {
      const startW = e.target.closest('[data-run-id]');
      const editW = e.target.closest('[data-edit-id]');
      const delW = e.target.closest('[data-remove-id]');

      if (startW) {
        const w = WorkoutStore.getWorkouts().find((item) => item.id === startW.dataset.runId);
        if (w) this.onRunWorkout(w);
      }

      if (editW) {
        const w = WorkoutStore.getWorkouts().find((item) => item.id === editW.dataset.editId);
        if (w) this.#startEditing(w);
      }

      if (delW) {
        if (!confirm(I18n.t('confirmDeleteWorkout'))) return;
        const removeId = delW.dataset.removeId;
        const updated = WorkoutStore.getWorkouts().filter((item) => item.id !== removeId);
        WorkoutStore.saveWorkouts(updated);

        if (this.editingId === removeId) {
          this.#resetForm();
        }

        this.renderSavedWorkouts();
        this.onWorkoutsChanged();
      }
    });
  }

  #startEditing(workout) {
    this.editingId = workout.id;
    this.dom.workoutNameInput.value = workout.name;
    this.draftSteps = workout.steps.map((s) => ({ ...s }));
    this.dom.saveWorkoutBtn.textContent = I18n.t('btnUpdateWorkout');
    this.dom.cancelEditBtn.textContent = I18n.t('btnCancelEdit');
    this.dom.cancelEditBtn.hidden = false;
    this.renderDraftSteps();

    this.dom.workoutNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  #loadStepToForm(idx) {
    const step = this.draftSteps[idx];
    if (!step) return;

    WorkoutStore.addExercise(step.name);
    this.renderExerciseOptions();

    this.dom.exerciseSelect.value = step.name;
    this.dom.customExRow.hidden = true;
    this.dom.stepSets.value = step.sets;
    this.dom.stepWork.value = step.work;
    this.dom.stepRest.value = step.rest;
    this.dom.stepAfterRest.value = step.afterRest;

    this.draftSteps.splice(idx, 1);
    this.renderDraftSteps();
  }

  #resetForm() {
    this.editingId = null;
    this.dom.workoutNameInput.value = '';
    this.draftSteps = [];
    this.dom.saveWorkoutBtn.textContent = I18n.t('btnSaveWorkout');
    this.dom.cancelEditBtn.hidden = true;
    this.renderDraftSteps();
  }

  renderExerciseOptions() {
    const exercises = WorkoutStore.getExercises();
    let html = '';
    exercises.forEach((ex) => {
      html += `<option value="${ex}">${I18n.ex(ex)}</option>`;
    });
    html += `<option value="__custom__">${I18n.t('customExOption')}</option>`;
    this.dom.exerciseSelect.innerHTML = html;
  }

  #addDraftStep() {
    let name = this.dom.exerciseSelect.value;
    if (name === '__custom__') {
      name = this.dom.customExInput.value.trim();
      if (!name) return;
      WorkoutStore.addExercise(name);
      this.renderExerciseOptions();
      this.dom.exerciseSelect.value = name;
      this.dom.customExRow.hidden = true;
      this.dom.customExInput.value = '';
    }

    const sets = Math.max(1, parseInt(this.dom.stepSets.value, 10) || 1);
    const work = Math.max(5, parseInt(this.dom.stepWork.value, 10) || 30);
    const rest = Math.max(0, parseInt(this.dom.stepRest.value, 10) || 0);
    const afterRest = Math.max(0, parseInt(this.dom.stepAfterRest.value, 10) || 0);

    this.draftSteps.push({ name, sets, work, rest, afterRest });
    this.renderDraftSteps();
  }

  renderDraftSteps() {
    this.dom.saveWorkoutBtn.textContent = this.editingId
      ? I18n.t('btnUpdateWorkout')
      : I18n.t('btnSaveWorkout');
    this.dom.cancelEditBtn.textContent = I18n.t('btnCancelEdit');

    if (this.draftSteps.length === 0) {
      this.dom.draftStepsList.innerHTML = `<small style="color:#888">${I18n.t('noStepsYet')}</small>`;
      return;
    }

    this.dom.draftStepsList.innerHTML = this.draftSteps
      .map(
        (s, idx) => `
        <div class="list-item">
          <div class="list-item-info">
            <strong>${idx + 1}. ${I18n.ex(s.name)}</strong>
            <small>${I18n.t('stepMeta', { sets: s.sets, work: s.work, rest: s.rest, after: s.afterRest })}</small>
          </div>
          <div class="item-actions">
            <button type="button" class="btn btn-reset btn-xs" data-up-idx="${idx}">↑</button>
            <button type="button" class="btn btn-reset btn-xs" data-down-idx="${idx}">↓</button>
            <button type="button" class="btn btn-accent btn-xs" data-edit-step-idx="${idx}">✎</button>
            <button type="button" class="btn btn-danger btn-xs" data-del-idx="${idx}">✕</button>
          </div>
        </div>`
      )
      .join('');
  }

  #saveWorkout() {
    const title = this.dom.workoutNameInput.value.trim();
    if (!title || this.draftSteps.length === 0) {
      alert(I18n.t('alertFillWorkout'));
      return;
    }

    const workouts = WorkoutStore.getWorkouts();

    if (this.editingId) {
      const idx = workouts.findIndex((w) => w.id === this.editingId);
      if (idx !== -1) {
        workouts[idx] = {
          id: this.editingId,
          name: title,
          steps: this.draftSteps.map((s) => ({ ...s }))
        };
      }
    } else {
      workouts.push({
        id: 'w_' + Date.now(),
        name: title,
        steps: this.draftSteps.map((s) => ({ ...s }))
      });
    }

    WorkoutStore.saveWorkouts(workouts);
    this.#resetForm();
    this.renderSavedWorkouts();
    this.onWorkoutsChanged();
  }

  renderSavedWorkouts() {
    const workouts = WorkoutStore.getWorkouts();
    this.dom.savedWorkoutsList.innerHTML = workouts
      .map((w) => {
        const totalSec = w.steps.reduce((acc, s, i) => {
          const workTotal = s.sets * s.work;
          const restTotal = Math.max(0, s.sets - 1) * s.rest;
          const after = i < w.steps.length - 1 ? s.afterRest : 0;
          return acc + workTotal + restTotal + after;
        }, 0);
        const mins = Math.round(totalSec / 60);

        return `
        <div class="list-item">
          <div class="list-item-info">
            <strong>${I18n.ex(w.name)}</strong>
            <small>${I18n.t('workoutMeta', { count: w.steps.length, mins })}</small>
          </div>
          <div class="item-actions">
            <button type="button" class="btn btn-start btn-sm" data-run-id="${w.id}">▶</button>
            <button type="button" class="btn btn-accent btn-sm" data-edit-id="${w.id}">✎</button>
            <button type="button" class="btn btn-danger btn-sm" data-remove-id="${w.id}">✕</button>
          </div>
        </div>`;
      })
      .join('');
  }
}
