export class I18n {
  static STORAGE_KEY = 'fit_lang_v1';
  static lang = 'ru';
  static dict = {};

  static setDict(dictionaries) {
    this.dict = dictionaries;
  }

  static init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'ru' || saved === 'en') {
      this.lang = saved;
    } else {
      const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
      const sysLang = (tgLang || navigator.language || 'ru').toLowerCase();
      this.lang = sysLang.startsWith('ru') ? 'ru' : 'en';
    }
    this.applyToDOM();
  }

  static toggle() {
    this.lang = this.lang === 'ru' ? 'en' : 'ru';
    localStorage.setItem(this.STORAGE_KEY, this.lang);
    this.applyToDOM();
  }

  static t(key, params = {}) {
    const pack = this.dict[this.lang] || this.dict.ru || {};
    let str = pack[key] ?? (this.dict.ru && this.dict.ru[key]) ?? key;
    Object.entries(params).forEach(([k, v]) => {
      str = str.replaceAll(`{${k}}`, v);
    });
    return str;
  }

  static applyToDOM() {
    document.documentElement.lang = this.lang;
    document.title = this.t('appTitle');

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = this.t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.placeholder = this.t(el.dataset.i18nPh);
    });

    const toggleBtn = document.getElementById('langToggleBtn');
    if (toggleBtn) {
      toggleBtn.textContent = this.lang === 'ru' ? 'EN' : 'RU';
    }

    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      el.innerHTML = this.t(el.dataset.i18nHtml);
    });

  }

    static EX_MAP = {
    'Разминка': 'Warm-up',
    'Подтягивания': 'Pull-ups',
    'Отжимания от пола': 'Push-ups',
    'Отжимания на брусьях': 'Dips',
    'Приседания': 'Squats',
    'Выпады': 'Lunges',
    'Планка': 'Plank',
    'Скручивания на пресс': 'Crunches',
    'Бёрпи': 'Burpees',
    'Скакалка': 'Jump Rope',
    'Бой с тенью': 'Shadowboxing',
    'Работа на мешке': 'Heavy Bag',
    'Заминка и растяжка': 'Cool-down & Stretching',
    'База: Турник и отжимания': 'Base: Pull-ups & Push-ups',
    'Бокс: Раунды и СФП': 'Boxing: Rounds & Conditioning'
  };

  static ex(name) {
    if (this.lang === 'ru') return name;
    return this.EX_MAP[name] || name;
  }

}
