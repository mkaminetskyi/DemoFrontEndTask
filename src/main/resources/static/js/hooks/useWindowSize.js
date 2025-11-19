// windowSize.js — перевикористовуваний модуль

class WindowSize {
  constructor(debounceMs = 250) {
    this.callbacks = new Set(); // всі підписники
    this.debounceMs = debounceMs;
    this.timer = null;
    this.currentSize = this.getSize();

    // Один глобальний обробник resize на весь додаток
    window.addEventListener("resize", this.handleResize);

    // Одразу повідомляємо поточний розмір (як return у хуку)
    this.notifyAll();
  }

  getSize = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  handleResize = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.currentSize = this.getSize();
      this.notifyAll();
    }, this.debounceMs);
  };

  notifyAll = () => {
    this.callbacks.forEach(cb => {
      try {
        cb(this.currentSize);
      } catch (err) {
        console.error("Помилка в callback useWindowSize:", err);
      }
    });
  };

  // Підписка — головна функція, яку ти будеш викликати
  subscribe(callback) {
    this.callbacks.add(callback);
    // Одразу викликаємо callback з поточним розміром (як return у React хуку)
    callback(this.currentSize);

    // Повертаємо функцію відписки
    return () => this.callbacks.delete(callback);
  }

  // Якщо треба прибрати все (наприклад при завершенні додатку)
  destroy() {
    window.removeEventListener("resize", this.handleResize);
    clearTimeout(this.timer);
    this.callbacks.clear();
  }
}

// Створюємо один єдиний екземпляр на весь проєкт
const windowSizeInstance = new WindowSize(250);

// Експортуємо просту функцію — точну копію React-хук за поведінкою
export function useWindowSize() {
  let currentSize = windowSizeInstance.getSize();

  const update = size => {
    currentSize = size;
    // Тут ти можеш робити що завгодно: оновлювати DOM, змінні тощо
    console.log("Window size changed →", size); // приклад
  };

  // Повертаємо об'єкт, який завжди актуальний
  const unsubscribe = windowSizeInstance.subscribe(size => {
    update(size);
  });

  // Повертаємо поточний розмір + функцію відписки (як cleanup у useEffect)
  return {
    get width() {
      return currentSize.width;
    },
    get height() {
      return currentSize.height;
    },
    get size() {
      return { ...currentSize };
    },
    unsubscribe, // якщо захочеш відписатись вручну
  };
}

// Якщо тобі просто треба отримати розмір один раз (без підписки)
export const getWindowSize = () => windowSizeInstance.getSize();

// ==========================================

// export function useWindowSize() {
//   const getSize = () => ({
//     width: window.innerWidth,
//     height: window.innerHeight,
//   });

//   let resizeTimer = 250;

//   window.addEventListener("resize", () => {
//     clearTimeout(resizeTimer);
//     resizeTimer = setTimeout(() => {
//       callback(getSize());
//     }, 250);
//   });

//   return getSize();
// }

// =================================================

// export function useWindowSize(callback) {
//   const getSize = () => ({
//       width: window.innerWidth,
//       height: window.innerHeight
//   });

//   if (callback && typeof callback === 'function') {
//       let resizeTimer;

//       window.addEventListener('resize', () => {
//           clearTimeout(resizeTimer);
//           resizeTimer = setTimeout(() => {
//               callback(getSize());
//           }, 250);
//       });
//   }

//   return getSize();
// }
