/**
 * Контроллер для Telegram Login Widget
 */

import { sendWidgetAuthRequest } from "./widget-auth-request.js";

/**
 * Створює контроллер для керування Telegram Login Widget
 * @param {Object} config - Конфігурація
 * @param {HTMLElement} config.container - DOM контейнер для віджету
 * @param {string} config.botUsername - Ім'я Telegram бота
 * @param {Function} [config.onStart] - Колбек при старті автентифікації
 * @param {Function} [config.onSuccess] - Колбек при успішній автентифікації
 * @param {Function} [config.onError] - Колбек при помилці
 * @returns {Object} - Контроллер з методом mount
 */
export function createWidgetController(config) {
  const handlerName = "__bulatTelegramWidgetAuth";
  const { container, botUsername, onStart, onSuccess, onError } = config;

  const available = Boolean(container && botUsername);
  let mounted = false;

  if (!available) {
    return {
      available: false,
      mount() {
        if (!botUsername && typeof onError === "function") {
          onError(new Error("Telegram bot username is not configured."));
        }
        return { mounted: false };
      },
    };
  }

  // Глобальний обробник який викликається Telegram віджетом
  window[handlerName] = function handleWidgetAuth(user) {
    if (!user) {
      return;
    }

    try {
      if (typeof onStart === "function") {
        onStart();
      }
    } catch (error) {
      console.error("Telegram widget start handler failed", error);
    }

    sendWidgetAuthRequest(user)
      .then((payload) => {
        if (typeof onSuccess === "function") {
          onSuccess(payload);
        }
      })
      .catch((error) => {
        if (typeof onError === "function") {
          onError(error);
        }
      });
  };

  return {
    available: true,
    mount() {
      if (mounted) {
        return { mounted: true };
      }

      if (!container) {
        return { mounted: false };
      }

      container.textContent = "";

      const script = document.createElement("script");
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.async = true;
      script.setAttribute("data-telegram-login", botUsername);
      script.setAttribute("data-size", "large");
      script.setAttribute("data-userpic", "false");
      script.setAttribute("data-request-access", "write");
      script.setAttribute("data-onauth", `${handlerName}(user)`);

      container.appendChild(script);
      mounted = true;
      return { mounted: true };
    },
  };
}
