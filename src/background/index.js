const extensionState = {
  lastPing: null,
  totalPings: 0
};
const CONFIRMATION_TIMEOUT_MS = 4000;
const pendingCloseTabs = new Map();
const reopenedTabSources = new Map();
let reopenPending = false;
let reopenConfirmTimeoutId = null;
let reopenPendingTabId = null;

function broadcastStatus() {
  chrome.runtime.sendMessage(
    {
      type: 'background:status',
      payload: {
        ...extensionState
      }
    },
    () => {
      if (chrome.runtime.lastError) {
        console.debug('[background] no listeners for status broadcast', chrome.runtime.lastError.message);
      }
    }
  );
}

function notifyUserInTab(tabId, message) {
  if (!tabId) {
    return;
  }
  chrome.tabs.sendMessage(
    tabId,
    { type: 'ui:toast', payload: { message } },
    () => {
      if (chrome.runtime.lastError) {
        console.debug('[background] toast delivery failed', chrome.runtime.lastError.message);
      }
    }
  );
}

function clearPendingClose(tabId) {
  const timeoutId = pendingCloseTabs.get(tabId);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  pendingCloseTabs.delete(tabId);
}

function setPendingClose(tabId) {
  clearPendingClose(tabId);
  const timeoutId = setTimeout(() => pendingCloseTabs.delete(tabId), CONFIRMATION_TIMEOUT_MS);
  pendingCloseTabs.set(tabId, timeoutId);
  notifyUserInTab(tabId, '再次执行以关闭标签页');
}

function clearReopenPending() {
  if (reopenConfirmTimeoutId) {
    clearTimeout(reopenConfirmTimeoutId);
  }
  reopenPending = false;
  reopenConfirmTimeoutId = null;
  reopenPendingTabId = null;
}

function setReopenPending(tabId) {
  clearReopenPending();
  reopenPending = true;
  reopenPendingTabId = tabId ?? null;
  reopenConfirmTimeoutId = setTimeout(() => {
    reopenPending = false;
    reopenConfirmTimeoutId = null;
    reopenPendingTabId = null;
  }, CONFIRMATION_TIMEOUT_MS);
  if (tabId) {
    notifyUserInTab(tabId, '再次执行以重新打开标签页');
  }
}

function execTabNavigation(method, tabId) {
  return new Promise((resolve) => {
    chrome.tabs[method](tabId, () => {
      if (chrome.runtime.lastError) {
        console.debug(`[background] ${method} unavailable`, chrome.runtime.lastError.message);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function closeTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabId, () => {
      if (chrome.runtime.lastError) {
        console.warn('[background] unable to close tab', chrome.runtime.lastError.message);
      }
      resolve();
    });
  });
}

function reopenLastClosedTab() {
  return new Promise((resolve) => {
    chrome.sessions.restore(undefined, (session) => {
      if (chrome.runtime.lastError || !session) {
        console.warn('[background] unable to restore last closed tab', chrome.runtime.lastError?.message);
        resolve(null);
      } else if (session.tab?.id) {
        resolve(session.tab.id);
      } else {
        resolve(null);
      }
    });
  });
}

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs?.[0]);
    });
  });
}

function activateTab(tabId) {
  return new Promise((resolve) => {
    if (!tabId) {
      resolve(false);
      return;
    }
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) {
        resolve(false);
        return;
      }
      chrome.tabs.update(tabId, { active: true }, () => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  });
}

async function captureRouteStack(tabId) {
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => ({
        length: history.length,
        state: history.state,
        url: location.href
      })
    });
    return result?.result ?? null;
  } catch (error) {
    console.warn('[background] unable to read route stack', error);
    return null;
  }
}

async function handleBackCommand() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }

  const stack = await captureRouteStack(tab.id);
  console.debug('[background] route stack (back)', stack);

  if (stack && stack.length <= 1) {
    if (pendingCloseTabs.has(tab.id)) {
      console.info('[background] confirmed close for tab', tab.id);
      clearPendingClose(tab.id);
      const tabToClose = tab.id;
      if (reopenedTabSources.has(tabToClose)) {
        const sourceId = reopenedTabSources.get(tabToClose);
        reopenedTabSources.delete(tabToClose);
        await activateTab(sourceId);
        await closeTab(tabToClose);
      } else {
        await closeTab(tabToClose);
      }
    } else {
      console.info('[background] history stack empty, awaiting confirmation to close', tab.id);
      setPendingClose(tab.id);
    }
    return;
  }

  const navigated = await execTabNavigation('goBack', tab.id);
  if (navigated) {
    clearPendingClose(tab.id);
    return;
  }

  if (pendingCloseTabs.has(tab.id) || !stack) {
    if (pendingCloseTabs.has(tab.id)) {
      console.info('[background] confirmed close for tab', tab.id);
      clearPendingClose(tab.id);
      const tabToClose = tab.id;
      if (reopenedTabSources.has(tabToClose)) {
        const sourceId = reopenedTabSources.get(tabToClose);
        reopenedTabSources.delete(tabToClose);
        await activateTab(sourceId);
        await closeTab(tabToClose);
      } else {
        await closeTab(tabToClose);
      }
    } else {
      console.info('[background] goBack failed without stack info, awaiting confirmation to close', tab.id);
      setPendingClose(tab.id);
    }
  } else {
    setPendingClose(tab.id);
  }
}

async function handleForwardCommand() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }

  const stack = await captureRouteStack(tab.id);
  console.debug('[background] route stack (forward)', stack);

  const navigated = await execTabNavigation('goForward', tab.id);
  if (navigated) {
    clearReopenPending();
    return;
  }

  if (reopenPending && reopenPendingTabId === tab.id) {
    console.info('[background] confirmed reopen last closed tab');
    clearReopenPending();
    const sourceTabId = tab.id;
    const reopenedTabId = await reopenLastClosedTab();
    if (reopenedTabId) {
      reopenedTabSources.set(reopenedTabId, sourceTabId);
    }
  } else {
    console.info('[background] unable to go forward, awaiting confirmation to reopen last tab');
    setReopenPending(tab.id);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  console.info('[background] extension installed', details);
  extensionState.lastPing = Date.now();
  broadcastStatus();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  switch (message.type) {
    case 'content:ping': {
      extensionState.lastPing = Date.now();
      extensionState.totalPings += 1;
      console.debug('[background] received ping', sender.tab?.url);
      broadcastStatus();
      sendResponse({ ok: true, ...extensionState });
      break;
    }
    case 'hotkey:back': {
      handleBackCommand();
      break;
    }
    case 'hotkey:forward': {
      handleForwardCommand();
      break;
    }
    default: {
      console.warn('[background] unknown message type', message.type);
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearPendingClose(tabId);
  reopenedTabSources.delete(tabId);
  if (reopenPendingTabId === tabId) {
    reopenPendingTabId = null;
  }
});

