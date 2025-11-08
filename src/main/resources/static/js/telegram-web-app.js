// telegram-webapp.js — вся логіка Telegram WebApp
document.addEventListener("DOMContentLoaded", () => {
  const tg = window.Telegram.WebApp;

  const isTelegramOpen = tg && tg.initData && tg.initData.length > 0;

  if (isTelegramOpen) {
    const telegramHeader = document.getElementById('telegramHeader')
    if (telegramHeader) {
      telegramHeader.classList.remove("is-hidden")
    }
  }

  // Ініціалізація
  tg.ready();
  tg.expand(); // КРИТИЧНО!

  // Сховати стандартні кнопки
  tg.MainButton.hide();
  tg.BackButton.hide();

  // Опціонально: заборонити свайпи вниз (якщо не хочеш випадкове закриття)
  tg.disableVerticalSwipes();

  // === КАСТОМНІ КНОПКИ ===
  const closeBtn = document.getElementById("closeTelegramBtn");
  const menuBtn = document.getElementById("menuTelegramBtn");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => tg.close());
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      // Наприклад, відкрити бокове меню
      document.body.classList.toggle("menu-open");
    });
  }

  // Адаптація під тему (оновлюється динамічно)
  function applyTheme() {
    document.documentElement.style.setProperty("--tg-bg", tg.backgroundColor);
  }
  applyTheme();
});
