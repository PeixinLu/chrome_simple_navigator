// Toast通知显示脚本
// 该脚本会在页面上显示倒计时Toast通知

let toastElement = null;
let countdownTimer = null;
let COUNTDOWN_DURATION = 1000; // 默认1秒倒计时，会根据设置动态调整

// 创建Toast元素
function createToast() {
  if (toastElement) {
    return toastElement;
  }

  const toast = document.createElement('div');
  toast.id = 'simple-navigator-toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(15, 23, 42, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    min-width: 200px;
    max-width: 280px;
    display: none;
    animation: slideIn 0.2s ease-out;
  `;

  const message = document.createElement('div');
  message.id = 'simple-navigator-toast-message';
  message.style.cssText = `
    margin-bottom: 8px;
    line-height: 1.4;
  `;

  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    overflow: hidden;
  `;

  const progressFill = document.createElement('div');
  progressFill.id = 'simple-navigator-toast-progress';
  progressFill.style.cssText = `
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6);
    border-radius: 999px;
    transition: width 50ms linear;
    width: 100%;
  `;

  progressBar.appendChild(progressFill);
  toast.appendChild(message);
  toast.appendChild(progressBar);

  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(toast);
  toastElement = toast;
  return toast;
}

// 显示Toast通知
function showToast(action, delay = 1000) {
  const toast = createToast();
  const message = document.getElementById('simple-navigator-toast-message');
  const progressFill = document.getElementById('simple-navigator-toast-progress');

  // 更新倒计时时长
  COUNTDOWN_DURATION = delay;

  // 清除之前的倒计时
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  // 设置消息文本
  if (action === 'close') {
    message.textContent = chrome.i18n.getMessage('toastCloseMsg');
  } else if (action === 'reopen') {
    message.textContent = chrome.i18n.getMessage('toastReopenMsg');
  }

  // 显示Toast
  toast.style.display = 'block';

  // 开始倒计时动画
  const startTime = Date.now();
  progressFill.style.width = '100%';

  countdownTimer = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, COUNTDOWN_DURATION - elapsed);
    const progress = (remaining / COUNTDOWN_DURATION) * 100;

    progressFill.style.width = progress + '%';

    if (remaining <= 0) {
      hideToast();
    }
  }, 50);
}

// 隐藏Toast通知
function hideToast() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  if (toastElement) {
    toastElement.style.display = 'none';
    const progressFill = document.getElementById('simple-navigator-toast-progress');
    if (progressFill) {
      progressFill.style.width = '100%';
    }
  }
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'background:showCloseConfirm') {
    const delay = message.payload.delay || 1000;
    showToast(message.payload.action, delay);
  }
  if (message?.type === 'background:hideConfirm') {
    hideToast();
  }
});
