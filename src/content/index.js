(() => {
  console.debug("[content] script loaded for", window.location.href);

  const TOAST_ID = "__sample_companion_toast__";
  let toastTimeoutId;

  function ensureToastElement() {
    let toast = document.getElementById(TOAST_ID);
    if (toast) {
      return toast;
    }

    toast = document.createElement("div");
    toast.id = TOAST_ID;
    toast.style.position = "fixed";
    toast.style.bottom = "24px";
    toast.style.right = "24px";
    toast.style.zIndex = "2147483647";
    toast.style.padding = "10px 14px";
    toast.style.borderRadius = "8px";
    toast.style.background = "rgba(15, 23, 42, 0.9)";
    toast.style.color = "#fff";
    toast.style.fontSize = "14px";
    toast.style.fontFamily =
      '"Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    toast.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.25)";
    toast.style.opacity = "0";
    toast.style.transition = "opacity 150ms ease";
    toast.style.pointerEvents = "none";

    document.documentElement.appendChild(toast);
    return toast;
  }

  function showToast(message) {
    const toast = ensureToastElement();
    toast.textContent = message;
    toast.style.opacity = "1";

    clearTimeout(toastTimeoutId);
    toastTimeoutId = setTimeout(() => {
      toast.style.opacity = "0";
    }, 2200);
  }

  function sendMessage(message, loggerTag) {
    chrome.runtime.sendMessage(message, (response) => {
      const { lastError } = chrome.runtime;
      if (lastError) {
        console.debug(`[content] ${loggerTag} send failed`, lastError.message);
        return;
      }
      return response;
    });
  }

  const pingBackground = () => {
    sendMessage({ type: "content:ping" }, "ping");
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      pingBackground();
    }
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (!event.altKey || event.repeat) {
        return;
      }

      if (event.key === "[") {
        console.info("[content] detected Alt+[ hotkey");
        sendMessage({ type: "hotkey:back" }, "hotkey:back");
      } else if (event.key === "]") {
        console.info("[content] detected Alt+] hotkey");
        sendMessage({ type: "hotkey:forward" }, "hotkey:forward");
      }
    },
    { capture: true }
  );

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "ui:toast" && message.payload?.message) {
      showToast(message.payload.message);
    }
  });

  pingBackground();
})();
