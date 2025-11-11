(() => {
  // Prevent multiple loads
  if (window.YourSaaSChatFullPage?.__loaded) return;

  const SCRIPT = document.currentScript;
  const cfg = {
    site: SCRIPT?.dataset.site || SCRIPT?.getAttribute("site") || "dev",
    api: SCRIPT?.dataset.api || SCRIPT?.getAttribute("api") || "staging-api.getmxpert.com/assistant/customer",
    theme: (SCRIPT?.dataset.theme || SCRIPT?.getAttribute("theme") || "light").toLowerCase(),
    primary: SCRIPT?.dataset.primary || SCRIPT?.getAttribute("primary") || "#3b82f6",
    containerId: SCRIPT?.dataset.containerId || SCRIPT?.getAttribute("containerId") || "yoursaas-chat-container",
    width: SCRIPT?.dataset.width || SCRIPT?.getAttribute("width") || "100%",
    height: SCRIPT?.dataset.height || SCRIPT?.getAttribute("height") || "600px",
  };

  // Find or create the container element
  let container = document.getElementById(cfg.containerId);
  if (!container) {
    console.warn(`[Chat] Container with ID "${cfg.containerId}" not found. Creating one.`);
    container = document.createElement("div");
    container.id = cfg.containerId;
    document.body.appendChild(container);
  }

  // Root mount point
  const root = document.createElement("div");
  root.setAttribute("data-yoursaas-chat-fullpage", "");
  root.style.all = "initial";
  root.style.width = cfg.width;
  root.style.height = cfg.height;
  root.style.display = "flex";
  root.style.flexDirection = "column";
  container.appendChild(root);

  // Shadow DOM for style isolation
  const shadow = root.attachShadow({ mode: "open" });

  // Styles
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      border-radius: 12px;
      overflow: hidden;
    }

    * { box-sizing: border-box; }

    .wrapper {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      background: ${cfg.theme === "dark" ? "#0b0f1a" : "#ffffff"};
      color: ${cfg.theme === "dark" ? "#ffffff" : "#111111"};
      font: 14px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
    }

    .header {
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      border-bottom: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#eee"};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      width: 24px;
      height: 24px;
      color: ${cfg.primary};
    }

    .close-btn {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font: inherit;
      padding: 8px 12px;
      font-size: 24px;
      line-height: 1;
      opacity: 0.6;
      transition: opacity 0.2s ease;
      display: none;
    }

    .close-btn:hover {
      opacity: 1;
    }

    .body {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .msgs {
      flex: 1;
      overflow-y: auto;
      padding: 20px 24px;
      gap: 12px;
      display: flex;
      flex-direction: column;
      background: ${cfg.theme === "dark" ? "#0b0f1a" : "#fff"};
    }

    .msg {
      max-width: 70%;
      padding: 10px 14px;
      border-radius: 12px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.5;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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
      align-self: flex-start;
      font-style: italic;
    }

    .inputrow {
      display: flex;
      gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid ${cfg.theme === 'dark' ? 'rgba(255,255,255,.08)' : '#eee'};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
      flex-shrink: 0;
    }

    .inputrow input {
      flex: 1;
      height: 40px;
      border-radius: 8px;
      border: 1px solid ${cfg.theme === 'dark' ? 'rgba(255,255,255,.12)' : '#ddd'};
      background: ${cfg.theme === 'dark' ? '#0f1526' : '#ffffff'};
      color: inherit;
      padding: 0 12px;
      outline: none;
      font: 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      transition: border-color 0.2s ease;
    }

    .inputrow input:focus {
      border-color: ${cfg.primary};
    }

    .inputrow button {
      height: 40px;
      border-radius: 8px;
      border: 0;
      background: ${cfg.primary};
      color: #ffffff;
      padding: 0 20px;
      cursor: pointer;
      font-weight: 600;
      font: 14px/1.2 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      transition: opacity 0.2s ease;
    }

    .inputrow button:hover {
      opacity: 0.9;
    }

    .inputrow button:active {
      opacity: 0.85;
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
      font-size: 13px;
    }

    .msg pre {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.03)"};
      border: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"};
      border-radius: 6px;
      padding: 12px;
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
      margin: 8px 0;
      padding-left: 20px;
    }

    .msg li {
      margin: 4px 0;
    }

    .msg blockquote {
      border-left: 3px solid ${cfg.primary};
      padding-left: 12px;
      margin: 8px 0;
      opacity: 0.8;
    }

    .msg h1, .msg h2, .msg h3, .msg h4, .msg h5, .msg h6 {
      margin: 12px 0 6px 0;
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

    .msg table {
      border-collapse: collapse;
      margin: 8px 0;
      width: 100%;
    }

    .msg table th,
    .msg table td {
      border: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"};
      padding: 6px 10px;
      text-align: left;
    }

    .msg table th {
      font-weight: 600;
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.02)"};
    }

    /* Scrollbar styling */
    .msgs::-webkit-scrollbar {
      width: 8px;
    }

    .msgs::-webkit-scrollbar-track {
      background: transparent;
    }

    .msgs::-webkit-scrollbar-thumb {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "rgba(0,0,0,.1)"};
      border-radius: 4px;
    }

    .msgs::-webkit-scrollbar-thumb:hover {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.2)"};
    }

    @media (max-width: 768px) {
      .header {
        padding: 0 16px;
      }

      .inputrow {
        padding: 12px 16px;
      }

      .msgs {
        padding: 16px;
      }

      .msg {
        max-width: 85%;
      }
    }
  `;
  shadow.appendChild(style);

  //
  // DOM structure
  //
  const wrapper = document.createElement("div");
  wrapper.className = "wrapper";

  wrapper.innerHTML = `
    <div class="header">
      <div class="header-title">
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 5.5A3.5 3.5 0 0 1 6.5 2h11A3.5 3.5 0 0 1 21 5.5v7A3.5 3.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A3.5 3.5 0 0 1 3 12.5v-7Z" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <span>Chat</span>
      </div>
      <button class="close-btn" aria-label="Close">&times;</button>
    </div>
    <div class="body">
      <div class="msgs" id="ys-msgs"></div>
      <form class="inputrow" id="ys-form">
        <input id="ys-input" placeholder="Type a message&" autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </div>
  `;

  shadow.appendChild(wrapper);

  //
  // Behavior
  //
  const msgsEl = wrapper.querySelector("#ys-msgs");
  const formEl = wrapper.querySelector("#ys-form");
  const inputEl = wrapper.querySelector("#ys-input");
  const closeBtn = wrapper.querySelector(".close-btn");

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
    html = html.replace(/```([\s\S]*?)```/g, (_match, code) => {
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

    // Ordered lists
    html = html.replace(/^\d+\. (.*?)$/gm, "<li>$1</li>");

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

  // form submit handler
  formEl.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendMessageToApi(text);
  });

  // Optional: Close button functionality (can be used to clear chat or navigate away)
  closeBtn.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent("yoursaas-chat:close"));
  });

  // Auto-focus the input
  setTimeout(() => {
    inputEl?.focus();
  }, 0);

  // public API on window
  const api = {
    __loaded: true,
    sendMessage: (text) => {
      inputEl.value = text;
      formEl.dispatchEvent(new Event("submit"));
    },
    clearChat: () => {
      msgsEl.innerHTML = "";
      conversationId = null;
      addMessage("Hi! How can I help?", "bot");
    },
    addMessage: (text, who = "bot") => {
      addMessage(text, who);
    },
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
      root?.remove();
      window.YourSaaSChatFullPage = undefined;
    },
  };
  window.YourSaaSChatFullPage = api;

  // greet message
  addMessage("Hi! How can I help?", "bot");
})();
