// DOM元素引用
const clearBtn = document.getElementById('clear');
const loggingToggle = document.getElementById('loggingToggle');
const logListEl = document.getElementById('logList');

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

// 监听来自后台的状态更新广播
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'background:status') {
    updateStatus(message.payload);
  }
});

// 页面加载时请求初始状态
requestStatus();
