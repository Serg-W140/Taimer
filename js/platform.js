export class Platform {
  static get isTelegram() {
    return Boolean(window.Telegram?.WebApp?.initData);
  }

  static get cloud() {
    return this.isTelegram ? window.Telegram.WebApp.CloudStorage : null;
  }

  static init() {
    if (!this.isTelegram) return;

    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) tg.setHeaderColor('#121212');
    if (tg.setBackgroundColor) tg.setBackgroundColor('#121212');
  }

  // Сохранение значения в облако Telegram (лимит 4096 символов на один ключ)
  static saveCloud(key, valueStr) {
    if (!this.cloud) return;
    try {
      this.cloud.setItem(key, valueStr, () => {});
    } catch (_) {}
  }

  // Загрузка всех ключей из облака Telegram
  static loadCloud(keys) {
    return new Promise((resolve) => {
      if (!this.cloud) {
        resolve(null);
        return;
      }
      try {
        this.cloud.getItems(keys, (err, values) => {
          if (err || !values) resolve(null);
          else resolve(values);
        });
      } catch (_) {
        resolve(null);
      }
    });
  }
}
