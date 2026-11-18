export class Platform {
  static get isTelegram() {
    return Boolean(window.Telegram?.WebApp?.initData);
  }

  static init() {
    if (this.isTelegram) {
      const tg = window.Telegram.WebApp;
      tg.ready();     // Сообщаем Telegram, что приложение готово
      tg.expand();    // Разворачиваем на всю высоту экрана
      
      // Подстраиваем цвет шапки Telegram под ваш тёмный дизайн (#121212)
      if (tg.setHeaderColor) tg.setHeaderColor('#121212');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#121212');
    }
  }

  // Универсальное уведомление (в ТГ красивое системное окно, в браузере — обычный alert)
  static alert(message) {
    if (this.isTelegram && window.Telegram.WebApp.showAlert) {
      window.Telegram.WebApp.showAlert(message);
    } else {
      window.alert(message);
    }
  }
}
