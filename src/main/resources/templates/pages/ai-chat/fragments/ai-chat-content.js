document.addEventListener("DOMContentLoaded", () => {
  const updateSearchWidth = () => {
    // Використовуємо getVisibleElement() з рядків 1-80
    const aiChatContent = getVisibleElement(
      "ai-chat-content-fragment",
    );

    if (!aiChatContent) {
      console.error("Visible chat container not found");
      return;
    }

    // Шукаємо дочірні елементи всередині видимого контейнера
    const searchBackdropBlur = aiChatContent.querySelector(
      "[data-js-search-backdrop-blur]",
    );

    if (!searchBackdropBlur) {
      console.error("Backdrop not found inside container");
      return;
    }

    const searchInput = aiChatContent.querySelector(
      "[data-js-search-input]",
    );

    if (!searchInput) {
      console.error("Search input not found inside container");
      return;
    }

    const widthAiChatContent = aiChatContent.offsetWidth;
    const rect = aiChatContent.getBoundingClientRect();

    console.log("Width:", widthAiChatContent, "Left:", rect.left);

    searchBackdropBlur.style.width = `${widthAiChatContent}px`;
    searchBackdropBlur.style.left = `${rect.left}px`;

    const widthSearchInput = widthAiChatContent - 20;
    searchInput.style.width = `${widthSearchInput}px`;
    // searchInput.style.left = `${rect.left}px`;
  };

  updateSearchWidth();

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      updateSearchWidth();
    }, 10);
  });
});
