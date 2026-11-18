
1. Инструкция пользователя (Русский)


⏱ Спортивный интервальный таймер и планер

Умный таймер для бокса, табаты, кроссфита и круговых тренировок с конструктором программ, гибким графиком и голосовым помощником. Работает в браузере, как автономное приложение на телефоне (PWA) и внутри Telegram.

📱 Как установить на телефон (чтобы работало без интернета)

• Android (Chrome): откройте сайт → нажмите на три точки в правом верхнем углу → выберите «Добавить на главный экран» (или «Установить приложение»).
• iPhone (Safari): откройте сайт → нажмите кнопку «Поделиться» (квадрат со стрелкой вверх) → выберите «На экран „Домой“».
• Telegram: откройте бота и нажмите кнопку меню. Все ваши программы автоматически сохраняются в облаке Telegram и синхронизируются между телефоном и компьютером.

🎯 Основные возможности

1. Вкладка «⏱ Таймер»
• Сегодня по плану: в самом верху отображаются все тренировки, запланированные на сегодняшний день, с точным временем. Нажмите «Загрузить», чтобы сразу перенести программу в таймер.
• Быстрые пресеты: готовые режимы в один клик (Бокс 3×3 мин, Интервалы 5×30 сек, Табата 8×20/10 сек) или ручная настройка подходов и времени.
• Звук и голос: выбор сигнала (боксёрский гонг, свисток тренера, электронный сигнал), предупреждение за 10 секунд до конца раунда, тиканье в работе и голосовой помощник, который вслух называет упражнения и подходы.
2. Вкладка «📋 Программы»
• Конструктор тренировок: создавайте собственные комплексы из любого количества упражнений (можно выбрать из списка или вписать своё).
• Два вида отдыха: для каждого упражнения задаётся отдых между подходами и отдельный отдых после упражнения (на смену снаряда).
• Управление программами:
	• ▶ — сразу запустить тренировку в таймере.
	• ✎ — открыть программу для просмотра или редактирования (можно менять порядок шагов стрелками ↑ ↓ и править любой подход).
	• ✕ — удалить программу.
3. Вкладка «📅 График»
• Два режима планирования:
	• По дням недели — привязка тренировок к конкретным дням (Пн–Вс).
	• Скользящий цикл — тренировки чередуются каждые N дней (например, «день через день» или «раз в 3 дня») от выбранной даты старта.
• Несколько тренировок в день: на любой день недели или день цикла можно добавить несколько слотов с индивидуальным временем (например, утренняя зарядка в 08:00 и основная тренировка в 19:30).
• 📅 Добавить в календарь телефона: скачивает файл .ics, который автоматически создаёт в вашем системном календаре (Google, Apple, Samsung) повторяющиеся события с напоминанием за указанное количество минут.

2. User Guide (English)


⏱ Interval Workout Timer & Planner

A customizable timer for boxing, Tabata, HIIT, and circuit training with a custom workout builder, flexible scheduling, and voice assistant. Works in any browser, as an offline Progressive Web App (PWA), and inside Telegram.

📱 How to Install on Your Phone (Offline Mode)

• Android (Chrome): open the website → tap the three dots in the top-right corner → select Add to Home screen (or Install app).
• iPhone (Safari): open the website → tap the Share button → select Add to Home Screen.
• Telegram: launch the bot and open the Mini App. Your workouts and schedule automatically sync across your devices via Telegram CloudStorage.

🎯 Key Features

1. «⏱ Timer» Tab
• Today's Plan: displays all workouts scheduled for today with their exact start times. Tap Load to send a workout straight to the timer.
• Quick Presets: one-tap presets (Boxing 3×3m, Intervals 5×30s, Tabata 8×20s/10s) or manual round setup.
• Sound & Voice: choose between Boxing Gong, Coach Whistle, or Electronic Beep; toggle 10-second warnings, work ticking, and the voice assistant that announces exercises and sets out loud.
2. «📋 Workouts» Tab
• Workout Builder: build multi-step routines from built-in or custom exercises.
• Dual Rest Timers: set separate rest durations between sets and after each exercise (transition time).
• Manage Programs:
	• ▶ — load and run the workout immediately.
	• ✎ — view or edit an existing program (reorder steps with ↑ ↓ or tweak any step).
	• ✕ — delete a program.
3. «📅 Schedule» Tab
• Two Scheduling Modes:
	• By days of week — assign workouts to specific weekdays (Mon–Sun).
	• Rolling cycle — repeat a sequence every N days starting from a chosen date.
• Multiple Sessions per Day: schedule multiple workouts on the same day with individual start times (e.g., morning mobility at 08:00 and evening boxing at 19:30).
• 📅 Add to Phone Calendar: generates a standard .ics file that imports recurring workout events with custom reminders straight into your phone's native calendar.


3. Техническая документация (Architecture & Dev Docs)


Стек и принципы

• Zero-dependency Vanilla JS (ES6+ Modules): без фреймворков и сборщиков, работает напрямую в браузере и на GitHub Pages.
• Web Audio API: процедурный синтез всех звуковых сигналов (гонг, свисток с LFO-модуляцией, тиканье, предупреждения) без внешних аудиофайлов.
• Web Speech API (speechSynthesis): голосовое сопровождение на ru-RU и en-US.
• Screen Wake Lock API: удержание экрана активным во время работы таймера.
• Offline-first PWA: Service Worker (sw.js) со стратегией Network First, Cache Fallback для мгновенной загрузки без сети и автоматического получения обновлений при наличии интернета.

Структура файлов проекта

text
├── index.html          # Основная разметка интерфейса (3 вкладки + атрибуты data-i18n)
├── style.css           # Адаптивная тёмная тема на CSS Variables и Flexbox/Grid
├── manifest.json       # Манифест PWA для установки на главный экран
├── sw.js               # Service Worker (кэширование и офлайн-режим)
└── js/
    ├── main.js         # Точка входа, инициализация модулей и переключение вкладок
    ├── platform.js     # Адаптер среды: определение Telegram WebApp и работа с CloudStorage
    ├── i18n.js         # Движок локализации (автоопределение языка, перевод DOM и упражнений)
    ├── dict.js         # Словари интерфейса и голосовых фраз (ru / en)
    ├── store.js        # Слой данных: localStorage, синхронизация с облаком, генератор .ics
    ├── sound.js        # Аудиодвижок (Web Audio API + SpeechSynthesis)
    ├── timer.js        # Контроллер таймера, генерация очереди сегментов и WakeLock
    ├── builder.js      # Конструктор, просмотр и редактирование программ тренировок
    └── schedule.js     # Менеджер расписания (недельный график и скользящий цикл)
Используйте код с осторожностью.

Ключи хранения данных (localStorage и Telegram.WebApp.CloudStorage)

• fit_exercises_v1 — массив строк с названиями упражнений (JSON).
• fit_workouts_v1 — массив объектов программ тренировок { id, name, steps: [{ name, sets, work, rest, afterRest }] }.
• fit_schedule_v1 — объект настроек графика { mode, remind, weekly, cycle }.
• fit_lang_v1 — выбранный язык интерфейса ('ru' | 'en').