/**
 * Утиліти для роботи з Telegram
 */

/**
 * Визначає ім'я Telegram бота з різних джерел
 * @param {HTMLElement|null} container - DOM елемент з data-bot атрибутом
 * @param {Object} context - Контекст застосунку
 * @returns {string} - Ім'я бота або порожній рядок
 */
export function resolveBotUsername(container, context) {
  const fromData = container?.dataset?.bot;
  if (fromData && typeof fromData === "string") {
    return fromData.trim();
  }

  const fromContext = context?.botUsername;
  return typeof fromContext === "string" ? fromContext.trim() : "";
}

/**
 * Будує URL для відкриття Telegram міні-застосунку
 * @param {string} botUsername - Ім'я бота
 * @returns {string} - URL або порожній рядок
 */
export function buildMiniAppUrl(botUsername) {
  return botUsername ? `https://t.me/${botUsername}` : "";
}
