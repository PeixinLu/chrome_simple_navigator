// DOM元素引用
const clearBtn = document.getElementById('clear');
const loggingToggle = document.getElementById('loggingToggle');
const logListEl = document.getElementById('logList');
const confirmPanel = document.getElementById('confirmPanel');
const confirmMessage = document.getElementById('confirmMessage');
const progressFill = document.getElementById('progressFill');
const mainContent = document.querySelector('.popup');
const settingsBtn = document.getElementById('settingsBtn');
const usageText = document.getElementById('usageText');

// 倒计时相关变量
let countdownTimer = null;
let countdownStartTime = 0;
let COUNTDOWN_DURATION = 1000; // 默认1秒倒计时，会根据设置动态调整

// Toast状态变量
let currentAction = null; // 'close' 或 'reopen'
let isManualOpen = false; // 是否手动打开popup

// 操作类型的显示标签映射
const ACTION_LABELS = {
  shortcut_back: 'Shortcut · Back',
  shortcut_forward: 'Shortcut · Forward',
  back: 'Browser back',
  forward: 'Browser forward',
  await_close: 'Await close confirmation',
  close_tab: 'Close tab',
  await_reopen: 'Await reopen confirmation',
  reopen_tab: 'Reopen last tab'
};

// 格式化时间戳为可读时间
function formatTime(timestamp) {
  if (!timestamp) {
    return 'Unknown time';
  }
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour12: false });
}

// 渲染日志列表到UI
function renderLogs(logs, loggingEnabled) {
  logListEl.innerHTML = '';
  // 如果日志功能被禁用
  if (!loggingEnabled) {
    const disabled = document.createElement('li');
    disabled.className = 'empty';
    disabled.textContent = 'Logging disabled';
    logListEl.appendChild(disabled);
    return;
  }

  // 如果没有日志记录
  if (!Array.isArray(logs) || logs.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = 'No entries yet';
    logListEl.appendChild(empty);
    return;
  }

  // 遍历并渲染每条日志
  logs.forEach((log) => {
    const item = document.createElement('li');
    item.className = 'log-item';

    const header = document.createElement('div');
    header.className = 'log-item-header';

    const action = document.createElement('span');
    action.className = 'log-action';
    action.textContent = ACTION_LABELS[log.action] ?? log.action;

    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatTime(log.timestamp);

    header.appendChild(action);
    header.appendChild(time);

    const detail = document.createElement('p');
    detail.className = 'log-detail';
    detail.textContent = log.detail;

    item.appendChild(header);
    item.appendChild(detail);
    logListEl.appendChild(item);
  });
}

// 更新UI状态
function updateStatus(status) {
  const loggingEnabled = status?.loggingEnabled !== false;
  loggingToggle.checked = loggingEnabled;
  clearBtn.disabled = !loggingEnabled || (status?.navigationLogs?.length ?? 0) === 0;
  renderLogs(status?.navigationLogs ?? [], loggingEnabled);
}

// 向后台请求当前状态
function requestStatus() {
  chrome.runtime.sendMessage({ type: 'content:ping' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[popup] failed to reach background', chrome.runtime.lastError);
      return;
    }
    if (response?.ok) {
      updateStatus(response);
    }
  });
}

// 清空日志记录
function clearLogs() {
  chrome.runtime.sendMessage({ type: 'popup:clearLogs' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[popup] failed to clear logs', chrome.runtime.lastError);
      return;
    }
    if (response?.ok) {
      updateStatus(response);
    }
  });
}

// 设置日志记录开关
function setLogging(enabled) {
  chrome.runtime.sendMessage({ type: 'popup:setLogging', payload: { enabled } }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[popup] failed to toggle logging', chrome.runtime.lastError);
      loggingToggle.checked = !enabled;
      return;
    }
    if (response?.ok) {
      updateStatus(response);
    }
  });
}

// 绑定事件监听器
clearBtn.addEventListener('click', clearLogs);
loggingToggle.addEventListener('change', (event) => {
  setLogging(event.target.checked);
});
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// 页面加载时请求初始状态
requestStatus();

// 加载并显示快捷键配置
loadShortcutKeys();

// 检查popup打开方式：如果没有收到showCloseConfirm消息，说明是手动打开
setTimeout(() => {
  if (!currentAction) {
    // 手动打开popup，显示日志面板
    isManualOpen = true;
    mainContent.style.display = 'flex';
    confirmPanel.classList.add('hidden');
  }
}, 150); // 等待150ms，给background发送消息的时间

// 加载快捷键配置并更新显示文本
function loadShortcutKeys() {
  chrome.commands.getAll((commands) => {
    const backCommand = commands.find(cmd => cmd.name === 'go-back-or-close');
    const forwardCommand = commands.find(cmd => cmd.name === 'go-forward');

    const backKey = backCommand?.shortcut || 'Alt+Left';
    const forwardKey = forwardCommand?.shortcut || 'Alt+Right';

    // 格式化显示
    const backDisplay = formatShortcut(backKey);
    const forwardDisplay = formatShortcut(forwardKey);

    usageText.textContent = `Use ${backDisplay} for Back and ${forwardDisplay} for Forward. Repeat the command to close or reopen tabs when navigation is unavailable.`;
  });
}

// 格式化快捷键显示
function formatShortcut(shortcut) {
  if (!shortcut) return 'Not set';

  // 将Command转换为更友好的显示
  return shortcut
    .replace('Command', '⌘')
    .replace('Ctrl', 'Ctrl')
    .replace('Alt', 'Alt')
    .replace('Shift', 'Shift')
    .replace('Left', '←')
    .replace('Right', '→')
    .replace('Up', '↑')
    .replace('Down', '↓');
}

// 显示确认提示面板
function showConfirmPanel(action, delay = 1000) {
  // 清除之前的倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  // 更新倒计时时长
  COUNTDOWN_DURATION = delay;

  // 保存当前操作类型
  currentAction = action;
  isManualOpen = false; // 不是手动打开

  // 设置提示消息
  if (action === 'close') {
    confirmMessage.textContent = 'Press back again to close tab';
    // 后退：进度条从左向右
    progressFill.classList.remove('forward');
    progressFill.classList.add('back');
  } else if (action === 'reopen') {
    confirmMessage.textContent = 'Press forward again to reopen tab';
    // 前进：进度条从右向左
    progressFill.classList.remove('back');
    progressFill.classList.add('forward');
  }

  // 隐藏日志面板，显示toast
  mainContent.style.display = 'none';
  confirmPanel.classList.remove('hidden');

  // 开始倒计时动画
  countdownStartTime = Date.now();
  progressFill.style.width = '100%';

  countdownTimer = setInterval(() => {
    const elapsed = Date.now() - countdownStartTime;
    const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
    const progress = (remaining / COUNTDOWN_DURATION) * 100;

    progressFill.style.width = progress + '%';

    if (remaining <= 0) {
      hideConfirmPanel();
      // 倒计时结束，关闭popup
      window.close();
    }
  }, 50);
}

// 隐藏确认提示面板
function hideConfirmPanel() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  confirmPanel.classList.add('hidden');
  mainContent.style.display = 'flex';
  progressFill.style.width = '100%';
  currentAction = null;
}

// 监听来自后台的确认提示消息
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'background:showCloseConfirm') {
    const delay = message.payload.delay || 1000;
    showConfirmPanel(message.payload.action, delay);
  }
  if (message?.type === 'background:status') {
    // 只在手动打开时更新状态
    if (isManualOpen) {
      updateStatus(message.payload);
    }
  }
});

// 监听键盘事件，接管前进后退快捷键
document.addEventListener('keydown', async (event) => {
  // 只在toast显示时处理
  if (!currentAction) {
    return;
  }

  // 检查是否是Command+Left (后退) 或 Command+Right (前进)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isBack = isMac ? (event.metaKey && event.key === 'ArrowLeft') : (event.altKey && event.key === 'ArrowLeft');
  const isForward = isMac ? (event.metaKey && event.key === 'ArrowRight') : (event.altKey && event.key === 'ArrowRight');

  // 后退快捷键 + 当前是关闭确认状态
  if (isBack && currentAction === 'close') {
    event.preventDefault();
    event.stopPropagation();
    // 通知background执行关闭操作
    chrome.runtime.sendMessage({ type: 'popup:confirmClose' });
    window.close();
    return;
  }

  // 前进快捷键 + 当前是重新打开确认状态
  if (isForward && currentAction === 'reopen') {
    event.preventDefault();
    event.stopPropagation();
    // 通知background执行重新打开操作
    chrome.runtime.sendMessage({ type: 'popup:confirmReopen' });
    window.close();
    return;
  }

  // 反向操作：后退快捷键 + 当前是重新打开确认状态
  if (isBack && currentAction === 'reopen') {
    event.preventDefault();
    event.stopPropagation();
    // 取消操作，关闭toast
    hideConfirmPanel();
    window.close();
    return;
  }

  // 反向操作：前进快捷键 + 当前是关闭确认状态
  if (isForward && currentAction === 'close') {
    event.preventDefault();
    event.stopPropagation();
    // 取消操作，关闭toast
    hideConfirmPanel();
    window.close();
  }
}, true); // 使用capture阶段确保优先处理