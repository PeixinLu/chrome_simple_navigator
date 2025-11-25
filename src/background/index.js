// ============================================
// 常量定义
// ============================================
const MAX_NAV_LOGS = 20;
const CONFIRMATION_TIMEOUT_MS = 4000;

// ============================================
// 状态变量
// ============================================
let navLogCounter = 0;

const extensionState = {
  navigationLogs: [],
  loggingEnabled: true
};

const pendingCloseTabs = new Map();
const reopenedTabSources = new Map();
let reopenPending = false;
let reopenConfirmTimeoutId = null;
let reopenPendingTabId = null;

// ============================================
// 工具函数 - UI反馈
// ============================================

// 广播状态到所有监听器（如popup、options页面）
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

// 在扩展图标上短暂显示徽章文本（用于视觉反馈）
function flashBadge(text) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#4169e1" });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "" });
  }, 800);
}

// ============================================
// 工具函数 - 日志管理
// ============================================

// 添加导航日志记录，用于跟踪用户的导航操作历史
function addNavigationLog(action, detail) {
  if (!extensionState.loggingEnabled) {
    return;
  }
  navLogCounter = (navLogCounter + 1) % Number.MAX_SAFE_INTEGER;
  const entry = {
    id: `${Date.now()}-${navLogCounter}`,
    action,
    detail,
    timestamp: Date.now()
  };
  extensionState.navigationLogs = [entry, ...extensionState.navigationLogs].slice(0, MAX_NAV_LOGS);
  broadcastStatus();
}

// 清空所有导航日志记录
function clearNavigationLogs() {
  extensionState.navigationLogs = [];
  broadcastStatus();
}

// ============================================
// 工具函数 - 标签页操作
// ============================================

// 获取当前窗口中的活动标签页
function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs?.[0]);
    });
  });
}

// 激活（切换到）指定的标签页
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

// 关闭指定的标签页
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

// 重新打开最后关闭的标签页
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

// ============================================
// 工具函数 - 导航操作
// ============================================

// 执行标签页导航操作（如后退、前进）
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

// 捕获指定标签页的导航历史栈信息（历史记录长度、状态、当前URL）
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

// ============================================
// 工具函数 - 确认状态管理
// ============================================

// 清除标签页的待关闭状态（取消关闭确认）
function clearPendingClose(tabId) {
  const timeoutId = pendingCloseTabs.get(tabId);
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  pendingCloseTabs.delete(tabId);
}

// 设置标签页为待关闭状态（需要再次按快捷键确认关闭）
function setPendingClose(tabId) {
  clearPendingClose(tabId);
  const timeoutId = setTimeout(() => pendingCloseTabs.delete(tabId), CONFIRMATION_TIMEOUT_MS);
  pendingCloseTabs.set(tabId, timeoutId);
}

// 清除重新打开标签页的待确认状态
function clearReopenPending() {
  if (reopenConfirmTimeoutId) {
    clearTimeout(reopenConfirmTimeoutId);
  }
  reopenPending = false;
  reopenConfirmTimeoutId = null;
  reopenPendingTabId = null;
}

// 设置重新打开标签页的待确认状态（需要再次按快捷键确认重新打开）
function setReopenPending(tabId) {
  clearReopenPending();
  reopenPending = true;
  reopenPendingTabId = tabId ?? null;
  reopenConfirmTimeoutId = setTimeout(() => {
    reopenPending = false;
    reopenConfirmTimeoutId = null;
    reopenPendingTabId = null;
  }, CONFIRMATION_TIMEOUT_MS);
}

// ============================================
// 核心命令处理器
// ============================================

// 处理后退命令：尝试后退导航，如果历史记录为空则提示关闭标签页
async function handleBackCommand(triggerLabel = 'Back command') {
  flashBadge('◀');
  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }

  const stack = await captureRouteStack(tab.id);
  console.debug('[background] route stack (back)', stack);

  // 情况1：历史记录为空（只有一条记录）
  if (stack && stack.length <= 1) {
    if (pendingCloseTabs.has(tab.id)) {
      // 确认关闭标签页
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
      addNavigationLog('close_tab', `${triggerLabel} → History exhausted, closing active tab`);
    } else {
      // 等待确认关闭
      console.info('[background] history stack empty, awaiting confirmation to close', tab.id);
      addNavigationLog('await_close', `${triggerLabel} → History empty, waiting for confirmation to close`);
      setPendingClose(tab.id);
    }
    return;
  }

  // 情况2：尝试后退导航
  const navigated = await execTabNavigation('goBack', tab.id);
  if (navigated) {
    clearPendingClose(tab.id);
    addNavigationLog('back', `${triggerLabel} → Browser back navigation executed`);
    return;
  }

  // 情况3：后退失败，等待确认关闭
  if (pendingCloseTabs.has(tab.id)) {
    // 确认关闭标签页
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
    addNavigationLog('close_tab', `${triggerLabel} → Confirmed tab close`);
  } else {
    // 等待确认关闭
    console.info('[background] goBack failed, awaiting confirmation to close', tab.id);
    addNavigationLog('await_close', `${triggerLabel} → Unable to go back, waiting for confirmation to close`);
    setPendingClose(tab.id);
  }
}

// 处理前进命令：尝试前进导航，如果无法前进则提示重新打开最后关闭的标签页
async function handleForwardCommand(triggerLabel = 'Forward command') {
  flashBadge('▶');
  const tab = await getActiveTab();
  if (!tab?.id) {
    return;
  }

  // 尝试前进导航
  const navigated = await execTabNavigation('goForward', tab.id);
  if (navigated) {
    clearReopenPending();
    addNavigationLog('forward', `${triggerLabel} → Browser forward navigation executed`);
    return;
  }

  // 前进失败，处理重新打开标签页逻辑
  if (reopenPending && reopenPendingTabId === tab.id) {
    // 确认重新打开最后关闭的标签页
    console.info('[background] confirmed reopen last closed tab');
    clearReopenPending();
    const sourceTabId = tab.id;
    const reopenedTabId = await reopenLastClosedTab();
    if (reopenedTabId) {
      reopenedTabSources.set(reopenedTabId, sourceTabId);
    }
    addNavigationLog('reopen_tab', `${triggerLabel} → Reopened the most recently closed tab`);
  } else {
    // 等待确认重新打开
    console.info('[background] unable to go forward, awaiting confirmation to reopen last tab');
    addNavigationLog('await_reopen', `${triggerLabel} → Unable to go forward, waiting for confirmation to reopen last tab`);
    setReopenPending(tab.id);
  }
}

// ============================================
// 事件监听器
// ============================================

// 监听扩展安装事件
chrome.runtime.onInstalled.addListener((details) => {
  console.info('[background] extension installed', details);
});

// 监听来自其他页面的消息（popup、content script等）
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return;
  }

  switch (message.type) {
    // 响应ping请求，返回当前扩展状态
    case 'content:ping': {
      sendResponse({ ok: true, ...extensionState });
      break;
    }
    // 清空日志
    case 'popup:clearLogs': {
      clearNavigationLogs();
      sendResponse({ ok: true, ...extensionState });
      break;
    }
    // 设置是否启用日志记录
    case 'popup:setLogging': {
      if (typeof message.payload?.enabled === 'boolean') {
        extensionState.loggingEnabled = message.payload.enabled;
        broadcastStatus();
        sendResponse({ ok: true, ...extensionState });
      }
      break;
    }
    default: {
      console.warn('[background] unknown message type', message.type);
    }
  }
});

// 监听标签页关闭事件，清理相关状态
chrome.tabs.onRemoved.addListener((tabId) => {
  clearPendingClose(tabId);
  reopenedTabSources.delete(tabId);
  if (reopenPendingTabId === tabId) {
    reopenPendingTabId = null;
  }
});

// 监听快捷键命令
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "go-back-or-close") {
    await handleBackCommand('Shortcut Back');
  }
  if (command === "go-forward") {
    await handleForwardCommand('Shortcut Forward');
  }
});