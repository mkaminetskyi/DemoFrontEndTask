/**
 * DOM утиліти для роботи з елементами
 */

/**
 * Знаходить елемент за ID
 * @param {string} id - ID елемента
 * @returns {HTMLElement|null} - DOM елемент або null
 */
export function select(id) {
  return document?.getElementById(id) || null;
}

/**
 * Встановлює текст повідомлення та CSS клас модифікатора
 * @param {HTMLElement|null} element - DOM елемент
 * @param {string} text - Текст повідомлення
 * @param {string} [modifier] - CSS клас модифікатора (warning, error, success)
 */
export function setMessage(element, text, modifier) {
  if (!element) {
    return;
  }
  element.textContent = text;

  element.classList.remove("warning", "error", "success");
  if (modifier) {
    element.classList.add(modifier);
  }
}

/**
 * Керує станом завантаження (показує/ховає loader та retry кнопку)
 * @param {Object} ui - Об'єкт з UI елементами
 * @param {boolean} isLoading - Чи показувати loader
 */
export function setLoading(ui, isLoading) {
  if (ui.loader) {
    ui.loader.classList.toggle("is-hidden", !isLoading);
  }
  if (ui.retry) {
    ui.retry.classList.toggle("is-hidden", isLoading);
  }
}

/**
 * Показує/ховає елемент
 * @param {HTMLElement|null} element - DOM елемент
 * @param {boolean} shouldHide - Чи ховати елемент
 */
export function toggleHidden(element, shouldHide) {
  if (!element) {
    return;
  }
  element.classList.toggle("is-hidden", shouldHide);
}
