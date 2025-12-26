document.addEventListener("DOMContentLoaded", () => {
  const updateSearchWidth = () => {
    const aiChatContent = document.getElementById(
      "ai-chat-content-fragment",
    );
    const searchBackdropBlur = aiChatContent?.querySelector(
      "[data-js-search-backdrop-blur]",
    );
    const searchInput = aiChatContent?.querySelector(
      "[data-js-search-input]",
    );

    if (!aiChatContent || !searchBackdropBlur || !searchInput) {
      return;
    }

    const widthAiChatContent = aiChatContent.offsetWidth;
    const rect = aiChatContent.getBoundingClientRect();

    searchBackdropBlur.style.width = `${widthAiChatContent}px`;
    searchBackdropBlur.style.left = `${rect.left}px`;

    const widthSearchInput = widthAiChatContent - 20;
    searchInput.style.width = `${widthSearchInput}px`;
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
