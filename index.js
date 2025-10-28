(() => {
  // Prevent multiple loads
  if (window.YourSaaSChat?.__loaded) return;

  const SCRIPT = document.currentScript;
  const cfg = {
    site: SCRIPT?.dataset.site || "dev",
    api: SCRIPT?.dataset.api || "https://staging-api.getmxpert.com/assistant/customer",             
    position: SCRIPT?.dataset.position || "bottom-right",
    theme: (SCRIPT?.dataset.theme || "light").toLowerCase(),
    primary: SCRIPT?.dataset.primary || "#3b82f6",
  };

  // Root mount point
  const root = document.createElement("div");
  root.setAttribute("data-yoursaas-chat", "");
  root.style.all = "initial";
  root.style.position = "fixed";
  root.style.zIndex = "2147483647";
  root.style[cfg.position.includes("left") ? "left" : "right"] = "20px";
  root.style.bottom = "20px";
  document.documentElement.appendChild(root);

  // Shadow DOM for style isolation
  const shadow = root.attachShadow({ mode: "open" });

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; }

    .bubble {
      position: relative;
      width: 56px; height: 56px;
      border-radius: 9999px;
      display: grid; place-items: center;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(0,0,0,.2);
      background: ${cfg.primary};
      color: white;
      font: 14px/1 system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      transition: transform .15s ease;
      border: none;
    }
    .bubble:hover { transform: translateY(-1px); }

    .panel {
      position: absolute;
      bottom: 72px;
      ${cfg.position.includes("left") ? "left: 0" : "right: 0"};
      width: min(420px, calc(100vw - 32px));
      height: min(560px, calc(100vh - 120px));
      border-radius: 16px;
      overflow: hidden;
      display: none;
      background: ${cfg.theme === "dark" ? "#0b0f1a" : "#ffffff"};
      color: ${cfg.theme === "dark" ? "#ffffff" : "#111111"};
      box-shadow: 0 18px 60px rgba(0,0,0,.28);
      font: 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    }
    .panel.open { display: block; }

    .header {
      height: 46px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 0 12px;
      border-bottom: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#eee"};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
      font-weight: 600;
      font-size: 14px;
    }

    .close-btn {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font: inherit;
      padding: 6px 8px;
      line-height: 1;
    }

    .body {
      width: 100%;
      height: calc(100% - 46px);
      display:flex;
      flex-direction:column;
    }

    .msgs {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      gap: 8px;
      display: flex;
      flex-direction: column;
      background: ${cfg.theme === "dark" ? "#0b0f1a" : "#fff"};
    }

    .msg {
      max-width: 80%;
      padding: 8px 10px;
      border-radius: 10px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.4;
    }

    .msg.me {
      align-self: flex-end;
      background: ${cfg.primary};
      color: #ffffff;
    }

    .msg.bot {
      align-self: flex-start;
      background: ${cfg.theme === "dark" ? "#151b2c" : "#f3f4f6"};
      color: inherit;
    }

    .status {
      font-size: 12px;
      opacity: .7;
      align-self:flex-start;
      font-style: italic;
    }

    .inputrow {
      display:flex;
      gap:6px;
      padding: 8px;
      border-top: 1px solid ${cfg.theme==='dark' ? 'rgba(255,255,255,.08)' : '#eee'};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
    }

    .inputrow input {
      flex:1;
      height:36px;
      border-radius:8px;
      border:1px solid ${cfg.theme==='dark' ? 'rgba(255,255,255,.12)' : '#ddd'};
      background:${cfg.theme==='dark' ? '#0f1526' : '#ffffff'};
      color:inherit;
      padding:0 10px;
      outline:none;
      font: 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    }

    .inputrow button {
      height:36px;
      border-radius:8px;
      border:0;
      background:${cfg.primary};
      color:#ffffff;
      padding:0 12px;
      cursor:pointer;
      font-weight:500;
      font: 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    }

    .bubble svg {
      color: #fff;
    }
  `;
  shadow.appendChild(style);

  //
  // DOM structure
  //
  const bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 5.5A3.5 3.5 0 0 1 6.5 2h11A3.5 3.5 0 0 1 21 5.5v7A3.5 3.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A3.5 3.5 0 0 1 3 12.5v-7Z" stroke="currentColor" stroke-width="1.5" />
    </svg>
  `;

  const panel = document.createElement("div");
  panel.className = "panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  panel.innerHTML = `
    <div class="header">
      <div>Chat</div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="body">
      <div class="msgs" id="ys-msgs"></div>
      <form class="inputrow" id="ys-form">
        <input id="ys-input" placeholder="Type a message…" autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  shadow.appendChild(panel);
  shadow.appendChild(bubble);

  //
  // Behavior
  //
  const msgsEl = panel.querySelector("#ys-msgs");
  const formEl = panel.querySelector("#ys-form");
  const inputEl = panel.querySelector("#ys-input");
  const closeBtn = panel.querySelector(".close-btn");

  let isOpen = false;

  function scrollMsgsToBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  function addStatus(text, cssClass = "") {
    const d = document.createElement("div");
    d.className = `status ${cssClass}`.trim();
    d.textContent = text;
    msgsEl.appendChild(d);
    scrollMsgsToBottom();
    return d;
  }

  function addMessage(text, who /* "me" | "bot" */) {
    const d = document.createElement("div");
    d.className = `msg ${who}`;
    d.textContent = text;
    msgsEl.appendChild(d);
    scrollMsgsToBottom();
  }

  async function sendMessageToApi(userText) {
    // render user message immediately
    addMessage(userText, "me");

    // show "typing..."
    const typingNode = addStatus("...", "typing");

    try {
      const url = cfg.api.startsWith("http") ? cfg.api : `https://${cfg.api}`;
      console.log("[Chat] Sending message to endpoint:", url);
      console.log("[Chat] Request body:", { content: userText });

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userText,
        }),
      });

      if (!resp.ok) {
        const errorMsg = `HTTP ${resp.status}`;
        console.error("[Chat] HTTP Error:", errorMsg);
        throw new Error(errorMsg);
      }

      console.log("[Chat] Response received, status:", resp.status);

      // remove typing
      if (typingNode && typingNode.parentNode) {
        typingNode.parentNode.removeChild(typingNode);
      }

      // Handle streaming response
      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let botMessage = "";
      let messageEl = null;

      if (!reader) {
        console.error("[Chat] No response body available");
        throw new Error("No response body");
      }

      console.log("[Chat] Starting to read streaming response");

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log("[Chat] Stream complete");
          break;
        }

        const chunk = decoder.decode(value);
        // Split by newlines since the endpoint writes line-delimited JSON
        const lines = chunk.split("\n").filter(line => line.trim());

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            console.log("[Chat] Event received:", event.type, event);

            switch (event.type) {
              case "delta":
                // Stream text content
                botMessage += event.content;
                if (!messageEl) {
                  messageEl = document.createElement("div");
                  messageEl.className = "msg bot";
                  msgsEl.appendChild(messageEl);
                }
                messageEl.textContent = botMessage;
                scrollMsgsToBottom();
                break;

              case "error":
                console.error("[Chat] Error event from server:", event.content);
                addMessage(`Error: ${event.content}`, "bot");
                return;

              case "done":
                console.log("[Chat] Done event received with content length:", event.messageContent?.length);
                // Final message - update with complete content
                if (event.messageContent) {
                  botMessage = event.messageContent;
                  if (!messageEl) {
                    messageEl = document.createElement("div");
                    messageEl.className = "msg bot";
                    msgsEl.appendChild(messageEl);
                  }
                  messageEl.textContent = botMessage;
                  scrollMsgsToBottom();
                }
                return;
            }
          } catch (parseError) {
            // Skip invalid JSON lines
            console.warn("[Chat] Failed to parse JSON line:", line, parseError);
          }
        }
      }

      // Fallback if no done event received
      if (botMessage) {
        addMessage(botMessage, "bot");
      } else {
        addMessage("Thanks, we'll be in touch.", "bot");
      }
    } catch (err) {
      console.error("[Chat] Error sending message:", err.message || err);
      if (typingNode && typingNode.parentNode) {
        typingNode.parentNode.removeChild(typingNode);
      }
      addMessage(
        "Sorry, we're having trouble right now. Please call the shop.",
        "bot"
      );
    }
  }

  // form submit handler
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendMessageToApi(text);
  });

  // open/close behavior
  function openPanel(next) {
    isOpen = !!next;
    panel.classList.toggle("open", isOpen);
    bubble.setAttribute("aria-expanded", String(isOpen));

    // optional: focus the input when opened
    if (isOpen) {
      // microtask so panel is visible before focus()
      setTimeout(() => {
        inputEl?.focus();
      }, 0);

      // fire DOM event so host page can hook analytics
      window.dispatchEvent(new CustomEvent("yoursaas-chat:open"));
    } else {
      window.dispatchEvent(new CustomEvent("yoursaas-chat:close"));
    }
  }

  bubble.addEventListener("click", () => togglePanel());
  closeBtn.addEventListener("click", () => closePanel());

  function togglePanel() {
    openPanel(!isOpen);
  }
  function closePanel() {
    openPanel(false);
  }
  function openNow() {
    openPanel(true);
  }

  // Reduce animation if user prefers
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (mq.matches) {
    bubble.style.transition = "none";
  }

  // public API on window
  const api = {
    __loaded: true,
    open: openNow,
    close: closePanel,
    toggle: togglePanel,
    // fire custom events / tracking to your backend without user seeing a message
    track: (eventPayload) => {
      fetch(`https://${cfg.api}/chat/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site: cfg.site,
          event: eventPayload,
          pageUrl: window.location.href,
        }),
      }).catch(() => {});
    },
    destroy: () => {
      observer?.disconnect?.();
      root?.remove();
      window.YourSaaSChat = undefined;
    },
  };
  window.YourSaaSChat = api;

  // clean up if merchant removes the node
  let observer = new MutationObserver(() => {
    if (!document.documentElement.contains(root)) {
      observer.disconnect();
      window.YourSaaSChat = undefined;
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // greet message (optional)
  addMessage("Hi! How can I help?", "bot");
})();
