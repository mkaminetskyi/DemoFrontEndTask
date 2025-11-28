/**
 * Telegram автентифікація (міні-застосунок)
 */

import { STRINGS } from "../constants/strings.js";
import { parseResponse } from "../lib/http-utils.js";

/**
 * Створює API для Telegram автентифікації
 * @param {string} rawInitData - Сирі дані ініціалізації від Telegram
 * @param {Object} telegramApp - Telegram WebApp API
 * @returns {Object} - API з методами init та authenticate
 */
export function createTelegramAuth(rawInitData, telegramApp) {
  let statusListener = null;

  const notify = (text, modifier) => {
    if (typeof statusListener === "function") {
      statusListener(text, modifier);
    }
  };

  const authenticate = async () => {
    if (!rawInitData) {
      notify(
        `${STRINGS.notAuthorized} ${STRINGS.instruction}`,
        telegramApp ? "warning" : "error"
      );
      throw new Error("Telegram init data is missing");
    }

    notify(STRINGS.progress);

    const response = await window.fetch("/api/auth/telegram", {
      method: "POST",
    });
    const payload = await parseResponse(response);

    if (!response.ok) {
      const message =
        typeof payload === "string"
          ? payload
          : payload?.error || STRINGS.genericError;
      throw new Error(message);
    }

    return payload;
  };

  const init = async (options = {}) => {
    statusListener = options.onStatusChange || null;

    if (telegramApp) {
      try {
        telegramApp.expand();
      } catch (error) {
        // Ignore errors from expand
      }
    }

    if (!rawInitData) {
      if (!options.authenticated) {
        notify(
          `${STRINGS.notAuthorized} ${STRINGS.instruction}`,
          telegramApp ? "warning" : "error"
        );
      }
      return { status: "no-init-data" };
    }

    if (options.authenticated) {
      notify(STRINGS.alreadyAuthorized, "success");
      return { status: "already-authenticated" };
    }

    try {
      const payload = await authenticate();
      notify(STRINGS.success, "success");

      if (typeof options.onAuthenticated === "function") {
        options.onAuthenticated(payload);
      }

      return payload;
    } catch (error) {
      notify(`${STRINGS.failurePrefix}: ${error.message}`, "error");

      if (typeof options.onError === "function") {
        options.onError(error);
      }

      throw error;
    }
  };

  return { init, authenticate };
}
