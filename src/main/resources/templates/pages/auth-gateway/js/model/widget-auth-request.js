/**
 * HTTP запит для автентифікації через Telegram Widget
 */

import { parseResponse } from "../lib/http-utils.js";

/**
 * Відправляє дані від Telegram віджету на сервер для верифікації
 * @param {Object} user - Дані користувача від Telegram віджету
 * @returns {Promise<any>} - Payload від сервера
 * @throws {Error} - При помилці автентифікації
 */
export function sendWidgetAuthRequest(user) {
  return window
    .fetch("/api/auth/telegram/widget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    })
    .then(async (response) => {
      const payload = await parseResponse(response);

      if (!response.ok) {
        const message =
          typeof payload === "string"
            ? payload
            : payload?.error || "Telegram auth failed";
        throw new Error(message);
      }

      return payload;
    });
}
