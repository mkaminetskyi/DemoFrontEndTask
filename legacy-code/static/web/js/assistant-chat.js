(function(){
    const root = document.getElementById("assistantApp");
    if (!root) return;

    const chatWindow = document.getElementById("chatWindow");
    const chatForm = document.getElementById("chatForm");
    const messageInput = document.getElementById("messageInput");
    const sendBtn = document.getElementById("sendBtn");
    const config = {
        endpoint: root.dataset.endpoint || "/api/assistants/products/chat",
        assistantName: "AI консультант",
        userName: root.dataset.userName || "Користувач",
        loadingText: "Здійснюю пошук…",
        emptyError: "Введіть запит",
        errorGeneric: "Сталася помилка. Спробуйте повторити запит пізніше."
    };

    const scrollBottom = () => {
        if (!chatWindow) return;
        chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: "smooth" });
    };

    const createMessageElement = (role) => {
        const wrapper = document.createElement("div");
        wrapper.className = `chat-message card compact ${role}`;
        return wrapper;
    };

    const appendUserMessage = (text) => {
        if (!chatWindow) return;
        const message = createMessageElement("user");

        const label = document.createElement("div");
        label.className = "message-label";
        label.textContent = config.userName;
        message.appendChild(label);

        const paragraph = document.createElement("p");
        paragraph.textContent = text;
        message.appendChild(paragraph);

        chatWindow.appendChild(message);
        scrollBottom();
    };

    const buildProductList = (products) => {
        if (!Array.isArray(products) || products.length === 0) {
            return null;
        }

        const list = document.createElement("ol");
        list.className = "product-list";

        products.forEach((product, index) => {
            if (!product) return;
            const item = document.createElement("li");
            item.className = "product-item";

            const name = document.createElement("div");
            name.className = "product-name";
            name.textContent = `${index + 1}. ${product.name || "Без назви"}`;
            item.appendChild(name);

            if (product.reason) {
                const reason = document.createElement("div");
                reason.className = "product-reason";
                reason.textContent = product.reason;
                item.appendChild(reason);
            }

            const metaItems = [
                product.article ? `Артикул: ${product.article}` : null,
                product.manufacturer ? `Виробник: ${product.manufacturer}` : null,
                product.brand ? `Бренд: ${product.brand}` : null,
                product.description ? product.description : null
            ].filter(Boolean);

            if (metaItems.length) {
                const meta = document.createElement("div");
                meta.className = "product-meta";
                metaItems.forEach(text => {
                    const span = document.createElement("span");
                    span.textContent = text;
                    meta.appendChild(span);
                });
                item.appendChild(meta);
            }

            list.appendChild(item);
        });

        return list;
    };

    const appendAssistantMessage = (payload) => {
        if (!chatWindow) return;
        const { answer, products, title, note } = payload || {};

        const message = createMessageElement("assistant");

        const label = document.createElement("div");
        label.className = "message-label";
        label.textContent = config.assistantName;
        message.appendChild(label);

        if (title) {
            const heading = document.createElement("div");
            heading.className = "message-title";
            heading.textContent = title;
            message.appendChild(heading);
        }

        if (answer) {
            const paragraph = document.createElement("p");
            paragraph.textContent = answer;
            message.appendChild(paragraph);
        }

        const productList = buildProductList(products);
        if (productList) {
            message.appendChild(productList);
        }

        if (note) {
            const noteEl = document.createElement("div");
            noteEl.className = "message-note";
            noteEl.textContent = note;
            message.appendChild(noteEl);
        }

        chatWindow.appendChild(message);
        scrollBottom();
    };

    const appendSystemMessage = (text) => {
        if (!chatWindow) return null;
        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";
        indicator.textContent = text;
        chatWindow.appendChild(indicator);
        scrollBottom();
        return indicator;
    };

    if (chatForm) {
        chatForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = messageInput?.value?.trim();
            if (!message) {
                if (messageInput) {
                    messageInput.setCustomValidity(config.emptyError);
                    messageInput.reportValidity();
                    messageInput.setCustomValidity("");
                }
                return;
            }

            appendUserMessage(message);
            if (messageInput) {
                messageInput.value = "";
                messageInput.focus();
                messageInput.disabled = true;
            }
            if (sendBtn) sendBtn.disabled = true;

            const typing = appendSystemMessage(config.loadingText);

            try {
                const response = await fetch(config.endpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message })
                });

                const contentType = response.headers.get("content-type") || "";
                const isJson = contentType.includes("application/json");

                if (!response.ok) {
                    let errorMessage = config.errorGeneric;
                    if (isJson) {
                        const data = await response.json();
                        if (data && typeof data.error === "string") {
                            errorMessage = data.error;
                        }
                    } else {
                        const text = await response.text();
                        if (text) errorMessage = text;
                    }
                    throw new Error(errorMessage);
                }

                const data = isJson ? await response.json() : null;
                if (data) {
                    appendAssistantMessage(data);
                } else {
                    appendAssistantMessage({ answer: config.errorGeneric });
                }
            } catch (error) {
                console.error(error);
                const messageText = error?.message || config.errorGeneric;
                appendAssistantMessage({ answer: messageText });
            } finally {
                if (typing && typeof typing.remove === "function") typing.remove();
                if (sendBtn) sendBtn.disabled = false;
                if (messageInput) {
                    messageInput.disabled = false;
                    messageInput.focus();
                }
            }
        });
    }
})();
