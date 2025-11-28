/**
 * Fetch interceptor для автоматичного додавання Telegram заголовків
 */

import { prepareRequest } from "./http-utils.js";

const originalFetch = window.fetch.bind(window);

/**
 * Встановлює interceptor для fetch запитів
 * @param {string} encodedInitData - Закодовані Telegram initData
 */
export function setupFetchInterceptor(encodedInitData) {
  window.fetch = function overrideFetch(input, init) {
    if (!encodedInitData) {
      return originalFetch(input, init);
    }

    const prepared = prepareRequest(
      input,
      init,
      "X-Telegram-Init-Data",
      encodedInitData
    );
    return originalFetch(prepared.input, prepared.init);
  };
}
