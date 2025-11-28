/**
 * UI контроллер для auth-gateway сторінки
 */

import { STRINGS } from "../constants/strings.js";
import {
  select,
  setMessage,
  setLoading,
  toggleHidden,
} from "../lib/dom-utils.js";
import { resolveBotUsername, buildMiniAppUrl } from "../lib/telegram-utils.js";
import { createWidgetController } from "../model/telegram-widget.js";
import { redirectHome } from "./navigation.js";

/**
 * Ініціалізує UI для auth-gateway сторінки
 * @param {Object} context - Контекст застосунку
 * @param {string} rawInitData - Сирі Telegram initData
 * @param {Object} telegramApp - Telegram WebApp API
 */
export function initializeGateway(context, rawInitData, telegramApp) {
  if (!document?.body?.classList.contains("auth-gateway")) {
    return;
  }

  const ui = {
    message: select("authMessage"),
    loader: select("authLoader"),
    retry: select("retryButton"),
    widgetContainer: select("telegramWidgetContainer"),
    openMiniApp: select("openMiniAppButton"),
    browserHint: select("browserHint"),
  };

  const alreadyAuthenticated = Boolean(context.authenticated);
  const hasInitData = Boolean(rawInitData);
  const isTelegramEnv = Boolean(telegramApp);
  const botUsername = resolveBotUsername(ui.widgetContainer, context);
  const miniAppUrl = buildMiniAppUrl(botUsername);
  const widget = createWidgetController({
    container: ui.widgetContainer,
    botUsername,
    onSuccess: showAuthSuccess,
    onError: (error) => {
      console.error("Telegram widget auth error", error);
      setMessage(
        ui.message,
        "Не вдалося підтвердити авторизацію через Telegram. " +
          STRINGS.instruction,
        "error"
      );
      setLoading(ui, false);
      toggleHidden(ui.retry, false);
    },
  });

  if (ui.retry) {
    ui.retry.addEventListener("click", startAuthFlow);
  }

  if (ui.openMiniApp) {
    ui.openMiniApp.addEventListener("click", () => {
      if (miniAppUrl) {
        window.open(miniAppUrl, "_blank", "noopener");
      }
      widget.mount();
    });
  }

  if (alreadyAuthenticated) {
    showAuthSuccess();
    return;
  }

  if (isTelegramEnv && hasInitData) {
    setLoading(ui, true);
    window.setTimeout(startAuthFlow, 50);
  } else {
    showBrowserInstruction();
  }

  function startAuthFlow() {
    if (!window.TelegramAuth) {
      setMessage(
        ui.message,
        "Схоже, щось пішло не так. Оновіть сторінку або спробуйте пізніше.",
        "error"
      );
      setLoading(ui, false);
      return;
    }

    setLoading(ui, true);

    window.TelegramAuth.init({
      authenticated: alreadyAuthenticated,
      onStatusChange: (text, modifier) => setMessage(ui.message, text, modifier),
      onAuthenticated: showAuthSuccess,
      onError: (error) => {
        console.error("Auth error", error);
        setMessage(
          ui.message,
          "Не вдалося підтвердити авторизацію. " + STRINGS.instruction,
          "error"
        );
        setLoading(ui, false);
      },
    })
      .then((result) => {
        if (result?.status === "already-authenticated") {
          showAuthSuccess();
          return;
        }

        if (result?.status === "no-init-data") {
          showBrowserInstruction();
        }
      })
      .catch(() => {
        // Errors are handled via onError
      });
  }

  function showAuthSuccess() {
    setMessage(
      ui.message,
      "Авторизація успішна, відкриваємо головну…",
      "success"
    );
    setLoading(ui, true);
    redirectHome();
  }

  function showBrowserInstruction() {
    setLoading(ui, false);

    if (!botUsername) {
      setMessage(
        ui.message,
        "Неможливо продовжити без налаштованого Telegram-бота.",
        "error"
      );
      toggleHidden(ui.retry, true);
      toggleHidden(ui.openMiniApp, true);
      toggleHidden(ui.widgetContainer, true);
      toggleHidden(ui.browserHint, true);
      return;
    }

    setMessage(
      ui.message,
      "Відкрийте Bulat+ у Telegram через авторизацію нижче.",
      "warning"
    );
    toggleHidden(ui.retry, true);
    toggleHidden(ui.openMiniApp, !miniAppUrl);
    toggleHidden(ui.widgetContainer, false);

    if (ui.browserHint) {
      ui.browserHint.textContent =
        "Щоб продовжити, увійдіть через свій Telegram-акаунт і відкрийте застосунок Bulat+.";
      ui.browserHint.classList.remove("is-hidden");
    }

    const { mounted } = widget.mount();
    if (!mounted) {
      setMessage(
        ui.message,
        "Не вдалося завантажити Telegram-віджет авторизації.",
        "error"
      );
    }
  }
}
