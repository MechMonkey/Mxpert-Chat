(() => {
  // Prevent multiple loads
  if (window.YourSaaSChat?.__loaded) return;

  const SCRIPT = document.currentScript;
  const cfg = {
    site: SCRIPT?.dataset.site || SCRIPT?.getAttribute("site") || "dev",
    api: SCRIPT?.dataset.api || SCRIPT?.getAttribute("api") || "staging-api.getmxpert.com/assistant/customer",
    position: SCRIPT?.dataset.position || SCRIPT?.getAttribute("position") || "bottom-right",
    theme: (SCRIPT?.dataset.theme || SCRIPT?.getAttribute("theme") || "light").toLowerCase(),
    primary: SCRIPT?.dataset.primary || SCRIPT?.getAttribute("primary") || "#3b82f6",
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
      background: ${cfg.theme === "dark" ? "#0b0f1a" : "#ffffff"};
      color: ${cfg.theme === "dark" ? "#ffffff" : "#111111"};
      box-shadow: 0 18px 60px rgba(0,0,0,.28);
      font: 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    .panel.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .header {
      height: 56px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 0 16px;
      border-bottom: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#eee"};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
      font-weight: 600;
      font-size: 14px;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .profile-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${cfg.primary};
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .profile-icon svg {
      width: 18px;
      height: 18px;
      color: #ffffff;
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
      height: calc(100% - 56px);
      display:flex;
      flex-direction:column;
    }

    .footer {
      padding: 6px 8px;
      text-align: center;
      font-size: 11px;
      opacity: 0.6;
      border-top: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#eee"};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
      color: inherit;
    }

    .footer a {
      color: inherit;
      text-decoration: none;
      transition: opacity 0.2s ease;
    }

    .footer a:hover {
      opacity: 1;
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
      gap:8px;
      padding: 12px;
      border-top: 1px solid ${cfg.theme==='dark' ? 'rgba(255,255,255,.08)' : '#eee'};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
      align-items: flex-end;
    }

    .inputrow textarea {
      flex:1;
      min-height:40px;
      max-height:120px;
      border-radius:12px;
      border:1px solid ${cfg.theme==='dark' ? 'rgba(255,255,255,.15)' : '#d1d5db'};
      background:${cfg.theme==='dark' ? '#1a1f35' : '#ffffff'};
      color:inherit;
      padding:10px 14px;
      outline:none;
      font: 14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      resize: none;
      overflow-y: auto;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .inputrow textarea:focus {
      border-color: ${cfg.primary};
      box-shadow: 0 0 0 3px ${cfg.primary}20;
    }

    .inputrow textarea::placeholder {
      color: ${cfg.theme==='dark' ? 'rgba(255,255,255,.4)' : '#9ca3af'};
    }

    .inputrow button {
      min-height:40px;
      height:40px;
      border-radius:12px;
      border:0;
      background:${cfg.primary};
      color:#ffffff;
      padding:0 16px;
      cursor:pointer;
      font-weight:600;
      font: 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 8px ${cfg.primary}40;
    }

    .inputrow button:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${cfg.primary}50;
    }

    .inputrow button:active {
      transform: translateY(0);
    }

    .inputrow button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .bubble svg {
      color: #fff;
    }

    /* Markdown styles */
    .msg strong {
      font-weight: 600;
    }

    .msg em {
      font-style: italic;
    }

    .msg code {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.05)"};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .msg pre {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.03)"};
      border: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"};
      border-radius: 6px;
      padding: 10px;
      overflow-x: auto;
      margin: 8px 0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
    }

    .msg pre code {
      background: none;
      padding: 0;
      font-size: inherit;
    }

    .msg a {
      color: ${cfg.primary};
      text-decoration: underline;
      cursor: pointer;
    }

    .msg a:hover {
      opacity: 0.8;
    }

    .msg ul, .msg ol {
      margin: 6px 0;
      padding-left: 20px;
    }

    .msg li {
      margin: 4px 0;
    }

    .msg blockquote {
      border-left: 3px solid ${cfg.primary};
      padding-left: 10px;
      margin: 8px 0;
      opacity: 0.8;
    }

    .msg h1, .msg h2, .msg h3, .msg h4, .msg h5, .msg h6 {
      margin: 10px 0 6px 0;
      font-weight: 600;
    }

    .msg h1 { font-size: 18px; }
    .msg h2 { font-size: 16px; }
    .msg h3 { font-size: 15px; }
    .msg h4 { font-size: 14px; }
    .msg h5 { font-size: 13px; }
    .msg h6 { font-size: 12px; }

    .msg hr {
      border: none;
      border-top: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"};
      margin: 10px 0;
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
      <div class="header-content">
        <div class="profile-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <div>Chat with Service Advisor</div>
      </div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="body">
      <div class="msgs" id="ys-msgs"></div>
      <form class="inputrow" id="ys-form">
        <textarea id="ys-input" placeholder="Type a message…" rows="1" autocomplete="off"></textarea>
        <button type="submit">Send</button>
      </form>
      <div class="footer"><a href="https://mxpert.ai" target="_blank" rel="noopener noreferrer">Powered by Mxpert</a></div>
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
  let conversationId = null; // Track conversation ID across turns

  function scrollMsgsToBottom() {
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  // Simple markdown parser
  function parseMarkdown(text) {
    const div = document.createElement("div");
    let html = text;

    // Escape HTML to prevent injection
    const escapeHtml = (str) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
      return str.replace(/[&<>"']/g, (m) => map[m]);
    };

    // Process block elements first (to avoid conflicts)
    // Headers
    html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

    // Code blocks (triple backticks)
    html = html.replace(/```([\s\S]*?)```/g, (match, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre><code>${escapedCode}</code></pre>`;
    });

    // Blockquotes
    html = html.replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>");

    // Horizontal rule
    html = html.replace(/^---$/gm, "<hr />");

    // Unordered lists
    html = html.replace(/^\* (.*?)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>");

    // Process inline elements
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");

    // Italic
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Links [text](url)
    html = html.replace(/\[(.*?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Line breaks
    html = html.replace(/\n/g, "<br />");

    div.innerHTML = html;
    return div;
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

    // Parse markdown for bot messages, plain text for user messages
    if (who === "bot") {
      d.appendChild(parseMarkdown(text));
    } else {
      d.textContent = text;
    }

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

      const requestBody = { content: userText };
      if (conversationId) {
        requestBody.conversation_id = conversationId;
      }

      console.log("[Chat] Sending message to endpoint:", url);
      console.log("[Chat] Request body:", requestBody);

      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
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
                // Clear and re-render with markdown parsing
                messageEl.innerHTML = "";
                messageEl.appendChild(parseMarkdown(botMessage));
                scrollMsgsToBottom();
                break;

              case "status":
                // Show tool call status messages
                addStatus(event.content);
                break;

              case "error":
                console.error("[Chat] Error event from server:", event.content);
                addMessage(`Error: ${event.content}`, "bot");
                return;

              case "done":
                console.log("[Chat] Done event received with content length:", event.messageContent?.length);
                // Store conversation_id for subsequent messages
                if (event.conversation_id) {
                  conversationId = event.conversation_id;
                  console.log("[Chat] Conversation ID stored:", conversationId);
                }
                // Final message - update with complete content
                if (event.messageContent) {
                  botMessage = event.messageContent;
                  if (!messageEl) {
                    messageEl = document.createElement("div");
                    messageEl.className = "msg bot";
                    msgsEl.appendChild(messageEl);
                  }
                  messageEl.innerHTML = "";
                  messageEl.appendChild(parseMarkdown(botMessage));
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

  // Auto-resize textarea
  function autoResizeTextarea() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
  }

  // Handle textarea input for auto-resize
  inputEl.addEventListener('input', autoResizeTextarea);

  // Handle Enter key (Enter to send, Shift+Enter for new line)
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formEl.dispatchEvent(new Event('submit'));
    }
  });

  // form submit handler
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    inputEl.style.height = 'auto'; // Reset height after sending
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
