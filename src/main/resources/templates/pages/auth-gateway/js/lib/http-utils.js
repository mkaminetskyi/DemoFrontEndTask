/**
 * HTTP утиліти для роботи з запитами та відповідями
 */

/**
 * Парсить відповідь від сервера (JSON або текст)
 * @param {Response} response - Fetch Response об'єкт
 * @returns {Promise<any>} - Розпарсені дані
 */
export async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return response.json();
  }
  return response.text();
}

/**
 * Створює Headers об'єкт з різних джерел
 * @param {Headers|Object|undefined} source - Джерело headers
 * @returns {Headers} - Headers об'єкт
 */
export function createHeaders(source) {
  return source instanceof Headers
    ? new Headers(source)
    : new Headers(source || {});
}

/**
 * Підготовує fetch запит додаючи кастомний заголовок
 * @param {Request|string} input - URL або Request об'єкт
 * @param {Object} init - Опції fetch
 * @param {string} headerName - Назва заголовка
 * @param {string} headerValue - Значення заголовка
 * @returns {Object} - Підготовлені input та init
 */
export function prepareRequest(input, init, headerName, headerValue) {
  if (input instanceof Request) {
    const requestHeaders = new Headers(input.headers);
    const initHeaders = createHeaders(init?.headers);
    initHeaders.forEach((value, key) => {
      requestHeaders.set(key, value);
    });
    requestHeaders.set(headerName, headerValue);

    const preparedRequest = new Request(input, {
      ...init,
      headers: requestHeaders,
    });

    return { input: preparedRequest, init: undefined };
  }

  const headers = createHeaders(init?.headers);
  headers.set(headerName, headerValue);

  return {
    input,
    init: {
      ...(init || {}),
      headers,
    },
  };
}
