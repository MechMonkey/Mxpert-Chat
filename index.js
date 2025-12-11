(() => {
  // Prevent multiple loads
  if (window.YourSaaSChat?.__loaded) return;

  const SCRIPT = document.currentScript;
  const cfg = {
    site: SCRIPT?.dataset.site || SCRIPT?.getAttribute("site") || "dev",
    api: SCRIPT?.dataset.api || SCRIPT?.getAttribute("api") || "api-new.getmxpert.com/assistant/customer",
    position: SCRIPT?.dataset.position || SCRIPT?.getAttribute("position") || "bottom-right",
    theme: (SCRIPT?.dataset.theme || SCRIPT?.getAttribute("theme") || "light").toLowerCase(),
    primary: SCRIPT?.dataset.primary || SCRIPT?.getAttribute("primary") || "#3b82f6",
    publicId: SCRIPT?.dataset.publicId || SCRIPT?.getAttribute("publicId") || null,
  };

  // Constants
  const CONSTANTS = {
    PREVIEW_SHOWN_KEY: "mxpert-preview-shown",
    TRANSITION_FAST: "0.15s ease",
    TRANSITION_NORMAL: "0.2s ease",
    TRANSITION_SLOW: "0.3s ease",
  };

  // Validate page before rendering chat
  async function validatePageAccess() {
    try {
      const validationUrl = cfg.api.startsWith("http")
        ? `${cfg.api}/page/check`
        : `https://${cfg.api}/page/check`;

      const response = await fetch(validationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicId: cfg.publicId,
          reqOrigin: window.location.href,
        }),
      });

      console.log("[Chat] Validation response status:", response.status);

      if (!response.ok) {
        console.error("[Chat] Page validation failed with status:", response.status);
        console.log("[Chat] Dev mode: Allowing access despite validation failure");
        return true;
      }

      const result = await response.json();
      console.log("[Chat] Page validation result:", result);
      const isAllowed = result.content === true || result?.success === true;
      console.log("[Chat] Is page allowed?", isAllowed);
      return isAllowed;
    } catch (err) {
      console.error("[Chat] Error during page validation:", err.message || err);
      console.log("[Chat] Dev mode: Allowing access despite validation error");
      return true;
    }
  }

  // Setup navigation listeners for SPA support
  function setupNavigationListeners(onNavigate) {
    let lastUrl = window.location.href;

    const handleNavigation = () => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('[Chat] Navigation detected:', currentUrl);
        onNavigate();
      }
    };

    // Intercept History API (pushState and replaceState)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      // Use setTimeout to ensure the URL has updated
      setTimeout(handleNavigation, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setTimeout(handleNavigation, 0);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleNavigation);

    // Also listen for hashchange (for hash-based routing)
    window.addEventListener('hashchange', handleNavigation);

    // Return cleanup function
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handleNavigation);
      window.removeEventListener('hashchange', handleNavigation);
    };
  }

  // Track widget visibility state
  let isWidgetVisible = true;
  let initiallyAllowed = true;
  let cleanupNavigationListeners = null;

  // Handle navigation changes and revalidate access
  async function handleNavigationChange() {
    console.log('[Chat] Navigation detected, revalidating page access');
    const isAllowed = await validatePageAccess();

    if (isAllowed !== isWidgetVisible) {
      isWidgetVisible = isAllowed;
      console.log('[Chat] Widget visibility changed:', isWidgetVisible);

      // Apply or remove hidden class
      const root = document.querySelector('[data-yoursaas-chat]');
      if (root && root.shadowRoot) {
        const bubble = root.shadowRoot.querySelector('.bubble');
        const panel = root.shadowRoot.querySelector('.panel');
        const previewPopup = root.shadowRoot.querySelector('.preview-popup');

        if (isAllowed) {
          bubble?.classList.remove('widget-hidden');
          panel?.classList.remove('widget-hidden');
          previewPopup?.classList.remove('widget-hidden');
        } else {
          bubble?.classList.add('widget-hidden');
          panel?.classList.add('widget-hidden');
          previewPopup?.classList.add('widget-hidden');
        }
      }
    }
  }

  // Initialize chat widget
  async function initializeChatWidget() {
    // Reusable avatar SVG
    const AVATAR_SVG = `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#fc663d" d="M44.39,44.5H3.61c0-7,3.16-12.74,10.19-12.74H34.2c7,0,10.19,5.7,10.19,12.74Z"/>
    <path fill="#f7cc94" d="M27.82,21.56V33a3.82,3.82,0,0,1-7.64,0V21.56Z"/>
    <path fill="#f4b392" d="M31.57,17.74a10.57,10.57,0,0,1-3.75,7.54v2.55a6,6,0,0,1-7.64,0V25.28a10.57,10.57,0,0,1-3.75-7.54c.46-5,3.67-8.92,7.57-8.92S31.11,12.72,31.57,17.74Z"/>
    <path fill="#f7cc94" d="M31.65,16.46a10.6,10.6,0,0,1-.08,1.28,10.57,10.57,0,0,1-3.75,7.54,6,6,0,0,1-7.64,0,10.57,10.57,0,0,1-3.75-7.54,10.6,10.6,0,0,1-.08-1.28c0-5.63,3.42-10.19,7.65-10.19S31.65,10.83,31.65,16.46Z"/>
    <path fill="#f7cc94" d="M34.2,16.46A2.55,2.55,0,0,1,31.65,19c-1.41,0,0-1.14,0-2.55s-1.41-2.55,0-2.55A2.55,2.55,0,0,1,34.2,16.46Z"/>
    <path fill="#f7cc94" d="M13.8,16.46A2.55,2.55,0,0,0,16.35,19c1.41,0,0-1.14,0-2.55s1.41-2.55,0-2.55A2.55,2.55,0,0,0,13.8,16.46Z"/>
    <circle fill="#3f1400" cx="20.94" cy="14.17" r="0.51"/>
    <circle fill="#3f1400" cx="27.06" cy="14.17" r="0.51"/>
    <path fill="none" stroke="#3f1400" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M19.16,12.64s1.73-2,3.57-1"/>
    <path fill="none" stroke="#3f1400" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M28.84,12.64s-1.73-2-3.57-1"/>
    <path fill="none" stroke="#3f1400" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M23.49,14.68s-2,5.1-1,5.1h1"/>
    <path fill="none" stroke="#3f1400" stroke-linecap="round" stroke-linejoin="round" stroke-width="0.5" d="M23.49,21.81s3.06,0,4.08-1"/>
    <path fill="#3f1400" d="M17,14.44s3-5,3-6c0,0,1,2,7,0s6-5,6-5-5,2-8,1-7,0-6,2c0,0-2-1-2,0S15.05,13.45,17,14.44Z"/>
    <path fill="#3f1400" d="M30,6.48s3,7,1,8c0,0-3-6-3-7S30,6.48,30,6.48Z"/>
  </svg>`;

    // Helper function to temporarily add/remove classes for animations
    const animateClass = (element, className, duration = 300) => {
      element.classList.add(className);
      setTimeout(() => element.classList.remove(className), duration);
    };

    // Root mount point - create regardless of initial validation
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

    .bubble-icon {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .bubble-icon.chat-icon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .bubble-icon.close-icon {
      opacity: 0;
      transform: rotate(-90deg) scale(0.8);
    }

    .bubble.open .bubble-icon.chat-icon {
      opacity: 0;
      transform: rotate(90deg) scale(0.8);
    }

    .bubble.open .bubble-icon.close-icon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .preview-popup {
      position: absolute;
      bottom: 72px;
      ${cfg.position.includes("left") ? "left: 0" : "right: 0"};
      width: min(360px, calc(100vw - 80px));
      background: ${cfg.theme === "dark" ? "#1a1f35" : "#ffffff"};
      border-radius: 16px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      padding: 0;
      overflow: hidden;
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      pointer-events: none;
      transition: opacity 0.3s ease, transform 0.3s ease;
      border: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#e5e7eb"};
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }

    .preview-popup.show {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .preview-popup.hide {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .preview-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 18px;
      border-bottom: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#f0f0f0"};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#ffffff"};
    }

    .preview-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      border: 2px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "#f0f0f0"};
    }

    .preview-avatar svg {
      width: 50px;
      height: 50px;
      transform: translateY(2px);
    }

    .preview-title {
      font-weight: 600;
      font-size: 15px;
      color: ${cfg.theme === "dark" ? "#ffffff" : "#1f1f1f"};
      flex: 1;
      letter-spacing: -0.01em;
    }

    .preview-close {
      border: 0;
      background: transparent;
      color: ${cfg.theme === "dark" ? "#9ca3af" : "#9ca3af"};
      cursor: pointer;
      padding: 6px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .preview-close:hover {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,0.1)" : "#f5f5f5"};
      color: ${cfg.theme === "dark" ? "#ffffff" : "#4b5563"};
    }

    .preview-close svg {
      width: 16px;
      height: 16px;
    }

    .preview-body {
      padding: 20px 18px;
    }

    .preview-message {
      font-size: 15px;
      line-height: 1.5;
      color: ${cfg.theme === "dark" ? "#e5e7eb" : "#374151"};
      margin-bottom: 16px;
      font-weight: 400;
    }

    .preview-cta {
      background: ${cfg.primary};
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 20px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 8px ${cfg.primary}40;
      letter-spacing: -0.01em;
    }

    .preview-cta:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px ${cfg.primary}50;
    }

    .preview-cta:active {
      transform: translateY(0);
    }

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
      transform: scale(0.5) translateY(20px);
      transform-origin: ${cfg.position.includes("left") ? "bottom left" : "bottom right"};
      pointer-events: none;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @media (max-width: 480px) {
      .panel {
        position: fixed;
        bottom: 0;
        right: 0;
        left: 0;
        top: 0;
        width: 100vw;
        height: 100vh; /* Fallback */
        height: 100dvh;
        border-radius: 0;
        transform-origin: bottom right;
      }
      
      .preview-popup {
        position: fixed;
        bottom: 24px;
        left: 50%;
        right: auto;
        width: calc(100vw - 32px);
        max-width: 420px;
        transform: translate(-50%, 10px) scale(0.95);
      }

      .bubble.open {
        display: none;
      }

      .input-pill textarea {
        font-size: 16px !important;
      }

      .preview-popup.show {
        transform: translate(-50%, 0) scale(1);
      }

      .preview-popup.hide {
        transform: translate(-50%, 10px) scale(0.95);
      }
    }
    
    .panel.open {
      opacity: 1;
      transform: scale(1) translateY(0);
      pointer-events: auto;
    }

    .panel.closing {
      opacity: 0;
      transform: scale(0.5) translateY(20px);
      transition: all 0.3s cubic-bezier(0.6, 0.04, 0.98, 0.34);
    }

    .header {
      height: 72px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      padding: 0 20px;
      border-bottom: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.08)" : "#f0f0f0"};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#ffffff"};
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
    }

    .profile-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      border: 2px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.1)" : "#f0f0f0"};
    }

    .profile-icon svg {
      width: 56px;
      height: 56px;
      transform: translateY(3px);
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .header-title {
      font-weight: 600;
      font-size: 16px;
      color: ${cfg.theme === "dark" ? "#ffffff" : "#2c2c2c"};
      line-height: 1.3;
    }

    .header-subtitle {
      font-size: 13px;
      font-weight: 400;
      color: ${cfg.theme === "dark" ? "#9ca3af" : "#8b8b8b"};
      line-height: 1.2;
    }

    .close-btn {
      border: 0;
      background: transparent;
      color: ${cfg.theme === "dark" ? "#9ca3af" : "#999999"};
      cursor: pointer;
      padding: 6px;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,0.1)" : "#f5f5f5"};
      color: ${cfg.theme === "dark" ? "#ffffff" : "#2c2c2c"};
    }

    .close-btn svg {
      width: 22px;
      height: 22px;
    }

    .body {
      width: 100%;
      height: calc(100% - 72px);
      display:flex;
      flex-direction:column;
    }

    .footer {
      padding: 4px 8px 8px 8px;
      text-align: center;
      font-size: 11px;
      opacity: 0.5;
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

    .footer a {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10.5px;
    }

    .footer .logo-svg {
      height: 12px;
      width: auto;
      opacity: 0.7;
      transition: opacity 0.2s ease;
    }

    .footer a:hover .logo-svg {
      opacity: 1;
    }

    .msgs {
      flex: 1;
      overflow-y: auto;
      padding: 20px 16px;
      gap: 8px;
      display: flex;
      flex-direction: column;
      background: ${cfg.theme === "dark" ? "#0b0f1a" : "#fff"};
    }

    .msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 16px;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 14px;
      line-height: 1.45;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }

    .msg.me {
      align-self: flex-end;
      background: ${cfg.primary};
      color: #ffffff;
      border-radius: 16px 16px 4px 16px;
    }

    .msg.bot {
      align-self: flex-start;
      background: ${cfg.theme === "dark" ? "#151b2c" : "#f0f0f0"};
      color: ${cfg.theme === "dark" ? "#ffffff" : "#2c2c2c"};
      border-radius: 16px 16px 16px 4px;
    }

    .status {
      font-size: 12px;
      opacity: .7;
      align-self:flex-start;
      font-style: italic;
    }

    .inputrow {
      padding: 12px 16px 8px 16px;
      border-top: 1px solid ${cfg.theme==='dark' ? 'rgba(255,255,255,.08)' : '#eee'};
      background: ${cfg.theme === "dark" ? "#0f1526" : "#fafafa"};
    }

    .input-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: ${cfg.theme === "dark" ? "#1a1f35" : "#ffffff"};
      border: 1px solid ${cfg.theme === "dark" ? "rgba(255,255,255,.15)" : "#e5e7eb"};
      border-radius: 24px;
      padding: 6px 8px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .input-pill:focus-within {
      border-color: ${cfg.primary};
      box-shadow: 0 0 0 3px ${cfg.primary}20;
    }

    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: ${cfg.theme === "dark" ? "#9ca3af" : "#6b7280"};
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;
      padding: 0;
    }

    .icon-btn:hover {
      background: ${cfg.theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"};
      color: ${cfg.theme === "dark" ? "#e5e7eb" : "#374151"};
    }

    .input-pill textarea {
      flex: 1;
      min-height: 24px;
      max-height: 120px;
      border: none;
      background: transparent;
      color: inherit;
      padding: 8px;
      outline: none;
      font: 14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
      resize: none;
    }

    .input-pill textarea::placeholder {
      color: ${cfg.theme==='dark' ? 'rgba(255,255,255,.4)' : '#9ca3af'};
    }

    .send-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 50%;
      background: ${cfg.primary};
      color: white;
      cursor: pointer;
      padding: 0;
      transition: transform 0.15s ease, background 0.2s;
    }

    .send-btn:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
    }

    .send-btn:active {
      transform: scale(0.95);
    }

    .send-btn svg {
      width: 18px;
      height: 18px;
    }

    .send-btn:disabled {
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

    /* Message send animation */
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .msg.sending {
      animation: slideInUp 0.3s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
    }

    /* Send button pressed animation */
    .send-btn.sending {
      transform: scale(0.85);
    }

    /* Textarea sending state */
    .input-pill.sending {
      opacity: 0.6;
      pointer-events: none;
    }

    /* Hidden state for widget */
    .widget-hidden {
      display: none !important;
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
    <div class="bubble-icon chat-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3 5.5A3.5 3.5 0 0 1 6.5 2h11A3.5 3.5 0 0 1 21 5.5v7A3.5 3.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A3.5 3.5 0 0 1 3 12.5v-7Z" stroke="currentColor" stroke-width="1.5" />
      </svg>
    </div>
    <div class="bubble-icon close-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </div>
  `;

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");

    panel.innerHTML = `
    <div class="header">
      <div class="header-content">
        <div class="profile-icon">
          ${AVATAR_SVG}
        </div>
        <div class="header-text">
          <div class="header-title">Chat with Service Advisor</div>
          <div class="header-subtitle">AI-Powered</div>
        </div>
      </div>
      <button class="close-btn" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="body">
      <div class="msgs" id="ys-msgs"></div>
      <form class="inputrow" id="ys-form">
        <div class="input-pill">
            <textarea id="ys-input" placeholder="Type a message..." rows="1" autocomplete="off"></textarea>
            <button type="submit" class="send-btn" aria-label="Send message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
            </button>
        </div>
      </form>
      <div class="footer">
        <a href="https://mxpert.ai" target="_blank" rel="noopener noreferrer">
          <span>Powered by</span>
          <svg class="logo-svg" viewBox="0 406.08 1084.32 267.84" xmlns="http://www.w3.org/2000/svg" fill="currentColor">

            <rect height="201.45" width="38.56" y="411.69"/>
            <polygon points="227.07 613.13 183.31 613.13 183.05 492.23 123.75 591.84 102.75 591.84 56.41 515.66 56.41 441.27 114.02 536.79 188.22 411.69 226.49 411.69 227.07 613.13"/>
            <polygon points="307.53 521.89 259.86 458.31 310.22 458.31 333.36 490.17 307.53 521.89"/>
            <polygon points="426.77 613.13 375.84 613.13 341.92 565.73 306.78 613.13 257.86 613.13 324.39 526.46 376.7 458.31 424.47 458.31 366.86 534.02 426.77 613.13"/>
            <path d="M612.82,493.71A73.29,73.29,0,0,0,585.19,466Q567.78,456,545.9,456q-20.43,0-35.12,8.64a51.49,51.49,0,0,0-13.51,11.58V458.31H454.4V669h44.87V596.64a52.71,52.71,0,0,0,12.4,10.18q14.67,8.61,34.23,8.63,21.87,0,39.29-9.78A72.32,72.32,0,0,0,612.82,578Q623,560.19,623,535.72,623,511.57,612.82,493.71ZM572.23,558.6a38,38,0,0,1-14.09,14.82,38.5,38.5,0,0,1-20,5.19A39.27,39.27,0,0,1,518,573.42a36.59,36.59,0,0,1-14.09-14.82c-3.47-6.42-5.19-14-5.19-22.88s1.72-16.67,5.19-23A37.14,37.14,0,0,1,518,498a39.55,39.55,0,0,1,20.14-5.17,37.54,37.54,0,0,1,34.11,19.86q5.31,9.51,5.32,23C577.55,544.57,575.77,552.18,572.23,558.6Z"/>
            <path d="M775.55,564.5a52.69,52.69,0,0,1-17.12,11.22,58.22,58.22,0,0,1-21.73,3.75q-13.82,0-24-5a36.78,36.78,0,0,1-15.84-14.69,39.4,39.4,0,0,1-4.4-11.35l-39.35,18.39a70.48,70.48,0,0,0,5.06,10q10.92,18,30.92,28.33t46.49,10.36q21,0,37.13-6.47a69.49,69.49,0,0,0,26.74-18.55Zm24.16-71.23a72.14,72.14,0,0,0-28.91-27.6q-18.27-9.68-41-9.66-23.61,0-42.3,10.23A76.67,76.67,0,0,0,658,494.42q-10.8,18-10.77,41.3a86.93,86.93,0,0,0,.89,12.68H809.49c.21-1.93.4-4,.58-6.21s.28-4.17.28-5.9Q810.35,511.29,799.71,493.27ZM691.85,522.21a40.62,40.62,0,0,1,4.28-13.1A34.87,34.87,0,0,1,709.8,495a39.85,39.85,0,0,1,20.27-5,39.12,39.12,0,0,1,20.15,5,35.79,35.79,0,0,1,13.54,14,39.82,39.82,0,0,1,4.3,13.23Z"/>
            <path d="M888.92,478.66V458.32H846V613.14h44.9V540.05q0-22.17,11.37-32.67t29.78-10.5c1.73,0,3.35.05,4.89.14s3.26.25,5.18.43V456q-21.87,0-37.12,8.49A49.53,49.53,0,0,0,888.92,478.66Z"/>
            <polygon points="961.73 496.3 961.73 461.78 985.6 461.78 985.6 440.91 1030.51 411.03 1030.51 461.78 1069.07 461.78 1069.07 496.3 961.73 496.3"/>
            <path d="M1080,605.64a48.86,48.86,0,0,1-16.54,7.36,81.54,81.54,0,0,1-20,2.43q-27.33,0-42.58-13.93T985.6,559.91V496.3l44.91,18v45q0,9.79,5.19,15.11t14.09,5.32a28.9,28.9,0,0,0,18.13-5.76Z"/>
          </svg>
        </a>
      </div>
    </div>
  `;

    // Preview popup
    const previewPopup = document.createElement("div");
    previewPopup.className = "preview-popup";
    previewPopup.innerHTML = `
    <div class="preview-header">
      <div class="preview-avatar">
        ${AVATAR_SVG}
      </div>
      <div class="preview-title">Service Advisor</div>
      <button class="preview-close" aria-label="Close preview">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="preview-body">
      <div class="preview-message">
        Got any questions? I'm happy to help.
      </div>
      <button class="preview-cta">Start a conversation</button>
    </div>
  `;

    shadow.appendChild(panel);
    shadow.appendChild(previewPopup);
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

    // Simple markdown parser - optimized for fewer passes
    function parseMarkdown(text) {
      const div = document.createElement("div");

      // Escape HTML to prevent injection
      const escapeHtml = (str) => {
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
        return str.replace(/[&<>"']/g, (m) => map[m]);
      };

      // Process in a single pass with ordered replacements to avoid conflicts
      let html = text
        // Code blocks first (to protect from other replacements)
        .replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${escapeHtml(code.trim())}</code></pre>`)
        // Headers (largest to smallest to avoid conflicts)
        .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
        // Blockquotes
        .replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>")
        // Horizontal rule
        .replace(/^---$/gm, "<hr />")
        // Links (before bold/italic to avoid conflicts with asterisks)
        .replace(/\[(.*?)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
        // Bold (both styles)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/__(.+?)__/g, "<strong>$1</strong>")
        // Italic (both styles, after bold to avoid conflicts)
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/_([^_]+)_/g, "<em>$1</em>")
        // Inline code
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        // Unordered lists
        .replace(/^\* (.*?)$/gm, "<li>$1</li>")
        .replace(/(<li>.*?<\/li>)/s, "<ul>$1</ul>")
        // Line breaks last
        .replace(/\n/g, "<br />");

      div.innerHTML = html;
      return div;
    }

    function addStatus(text, cssClass = "") {
      const d = document.createElement("div");
      d.className = cssClass ? `status ${cssClass}` : "status";
      d.textContent = text;
      msgsEl.appendChild(d);
      scrollMsgsToBottom();
      return d;
    }

    function addMessage(text, who /* "me" | "bot" */, animate = false) {
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

      // Add sending animation for user messages
      if (animate && who === "me") {
        animateClass(d, "sending", 300);
      }
    }

    async function sendMessageToApi(userText) {
      // render user message immediately with animation
      addMessage(userText, "me", true);

      // show "typing..."
      const typingNode = addStatus("...", "typing");

      try {
        const url = cfg.api.startsWith("http") ? cfg.api : `https://${cfg.api}`;

        const requestBody = {
          content: userText,
          pageUrl: window.location.href
        };
        if (conversationId) {
          requestBody.conversation_id = conversationId;
        }

        console.log("[Chat] Sending message to endpoint:", url);
        console.log("[Chat] Request body:", requestBody);

        const resp = await fetch(`${url}/message`, {
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
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      const text = inputEl.value.trim();
      if (!text) return;

      // Get references to elements for animation
      const sendBtn = formEl.querySelector('.send-btn');
      const inputPill = formEl.querySelector('.input-pill');

      // Add sending animation classes
      animateClass(sendBtn, 'sending', 150);
      animateClass(inputPill, 'sending', 150);

      // Clear input immediately for better UX
      inputEl.value = "";
      inputEl.style.height = 'auto'; // Reset height after sending

      // Send the message
      sendMessageToApi(text);
    });

    // open/close behavior
    function openPanel(next) {
      const wasOpen = isOpen;
      isOpen = !!next;

      if (!isOpen && wasOpen) {
        // Add closing animation
        animateClass(panel, "closing", 300);
        panel.classList.remove("open");
        bubble.classList.remove("open");
      } else if (isOpen) {
        panel.classList.add("open");
        bubble.classList.add("open");
      } else {
        panel.classList.remove("open");
        bubble.classList.remove("open");
      }

      bubble.setAttribute("aria-expanded", String(isOpen));

      // optional: focus the input when opened
      if (isOpen) {
        // microtask so panel is visible before focus()
        setTimeout(() => {
          inputEl?.focus();
        }, 100);

        // fire DOM event so host page can hook analytics
        window.dispatchEvent(new CustomEvent("yoursaas-chat:open"));
      } else {
        window.dispatchEvent(new CustomEvent("yoursaas-chat:close"));
      }
    }

    bubble.addEventListener("click", togglePanel);
    closeBtn.addEventListener("click", closePanel);

    function togglePanel() {
      // Hide preview popup when opening panel
      if (!isOpen) hidePreviewPopup();
      openPanel(!isOpen);
    }

    function closePanel() {
      openPanel(false);
    }

    function openNow() {
      hidePreviewPopup();
      openPanel(true);
    }

    // Preview popup logic
    const previewCloseBtn = previewPopup.querySelector('.preview-close');
    const previewCtaBtn = previewPopup.querySelector('.preview-cta');
    let previewTimeout = null;

    function showPreviewPopup() {
      const previewShown = localStorage.getItem(CONSTANTS.PREVIEW_SHOWN_KEY);
      if (!previewShown && !isOpen) {
        setTimeout(() => {
          if (!isOpen) {
            previewPopup.classList.add('show');
          }
        }, 2000); // Show after 2 seconds
      }
    }

    function hidePreviewPopup() {
      // Clear any pending timeout
      if (previewTimeout) {
        clearTimeout(previewTimeout);
        previewTimeout = null;
      }
      animateClass(previewPopup, 'hide', 300);
      setTimeout(() => {
        previewPopup.classList.remove('show');
      }, 300);
      localStorage.setItem(CONSTANTS.PREVIEW_SHOWN_KEY, 'true');
    }

    previewCloseBtn.addEventListener('click', () => {
      hidePreviewPopup();
    });

    previewCtaBtn.addEventListener('click', () => {
      hidePreviewPopup();
      openNow();
    });

    // Show preview popup on page load (only if widget is visible)
    if (initiallyAllowed) {
      showPreviewPopup();
    }

    // Reduce animation if user prefers
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      bubble.style.transition = "none";
    }

    // clean up if merchant removes the node
    let observer = new MutationObserver(() => {
      if (!document.documentElement.contains(root)) {
        observer.disconnect();
        if (cleanupNavigationListeners) {
          cleanupNavigationListeners();
        }
        window.YourSaaSChat = undefined;
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // public API on window
    const api = {
      __loaded: true,
      open: openNow,
      close: closePanel,
      toggle: togglePanel,
      // Manually trigger re-validation (useful for custom routing scenarios)
      revalidate: handleNavigationChange,
      // Check if widget is currently visible
      isVisible: () => isWidgetVisible,
      // fire custom events / tracking to your backend without user seeing a message
      track: (eventPayload) => {
        const trackingUrl = cfg.api.startsWith("http") ? `${cfg.api}/chat/track` : `https://${cfg.api}/chat/track`;
        fetch(trackingUrl, {
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
        if (cleanupNavigationListeners) {
          cleanupNavigationListeners();
        }
        root?.remove();
        window.YourSaaSChat = undefined;
      },
    };
    window.YourSaaSChat = api;

    // greet message (optional)
    addMessage("Hi! How can I help?", "bot");

    // Initially hide widget elements if not allowed
    if (!initiallyAllowed) {
      bubble.classList.add('widget-hidden');
      panel.classList.add('widget-hidden');
      previewPopup.classList.add('widget-hidden');
    }
  }

  // Validate page access and initialize
  async function initialize() {
    // First, validate page access
    initiallyAllowed = await validatePageAccess();
    isWidgetVisible = initiallyAllowed;

    console.log('[Chat] Initial validation result:', initiallyAllowed);

    // Initialize the chat widget UI
    await initializeChatWidget();

    // Set up navigation listeners for SPA support
    cleanupNavigationListeners = setupNavigationListeners(handleNavigationChange);
    console.log('[Chat] Navigation listeners set up');
  }

  // Call the initialization function
  initialize().catch((err) => {
    console.error("[Chat] Unexpected error during initialization:", err);
  });
})();