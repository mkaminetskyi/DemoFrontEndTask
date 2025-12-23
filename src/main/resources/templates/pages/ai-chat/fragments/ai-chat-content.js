document.addEventListener("DOMContentLoaded", () => {
  let aiChatContent = null;
  let searchBackdropBlur = null;
  let searchInput = null;

  const findVisibleContainer = () => {
    // first element
    const chatContainers = document.querySelectorAll(
      "[data-js-ai-chat-content-fragment]",
    );

    let visibleContainer = null;

    chatContainers.forEach(container => {
      if (container.offsetParent !== null) {
        visibleContainer = container;
      }
    });

    if (!visibleContainer) {
      console.error("Visible chat container not found");
      return false;
    }

    aiChatContent = visibleContainer;

    // second element
    const backdrop = visibleContainer.querySelector(
      "[data-js-search-backdrop-blur]",
    );

    if (!backdrop) {
      console.error("Backdrop not found inside container");
      return false;
    }

    searchBackdropBlur = backdrop;

    // third element
    const input = visibleContainer.querySelector(
      "[data-js-search-input]",
    );

    if (!input) {
      console.error("Search input not found inside container");
      return false;
    }

    searchInput = input;

    return true;
  };

  const updateSearchWidth = () => {
    if (!findVisibleContainer()) {
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
