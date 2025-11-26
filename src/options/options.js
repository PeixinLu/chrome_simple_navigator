// 默认设置
const DEFAULT_SETTINGS = {
  enableTabClose: true,
  enableToast: true,
  toastDelay: 1000 // 单位：毫秒
};

// DOM元素
const enableTabCloseCheckbox = document.getElementById('enableTabClose');
const enableToastCheckbox = document.getElementById('enableToast');
const toastDelaySlider = document.getElementById('toastDelay');
const resetBtn = document.getElementById('resetBtn');
const saveIndicator = document.getElementById('saveIndicator');
const shortcutBtns = document.querySelectorAll('.shortcut-btn');

// 初始化i18n
function initI18n() {
  // 处理所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.textContent = message;
    }
  });

  // 处理 title 属性
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const message = chrome.i18n.getMessage(key);
    if (message) {
      el.setAttribute('title', message);
    }
  });

  // 更新页面标题
  document.title = chrome.i18n.getMessage('settingsTitle');
}

// 更新Toast延迟标签
function updateToastDelayLabel() {
  const delay = (toastDelaySlider.value / 1000).toFixed(1);
  const label = document.getElementById('toastDelayLabel');
  if (label) {
    label.textContent = chrome.i18n.getMessage('toastDelayLabel', [delay]);
  }
}

// 从存储中加载设置
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    enableTabCloseCheckbox.checked = settings.enableTabClose;
    enableToastCheckbox.checked = settings.enableToast;
    toastDelaySlider.value = settings.toastDelay;
    updateToastDelayDisplay(settings.toastDelay);
    updateToastSettingsState(settings.enableTabClose);
  });
}

// 保存设置到存储
function saveSettings(updates) {
  chrome.storage.sync.set(updates, () => {
    showSaveIndicator();
  });
}

// 显示保存提示
function showSaveIndicator() {
  saveIndicator.style.opacity = '0';
  saveIndicator.style.transform = 'translateY(-5px)';
  
  setTimeout(() => {
    saveIndicator.style.transition = 'all 0.3s ease';
    saveIndicator.style.opacity = '1';
    saveIndicator.style.transform = 'translateY(0)';
  }, 50);
}

// 更新Toast延迟显示值
function updateToastDelayDisplay(value) {
  updateToastDelayLabel();
}

// 更新Toast设置的启用/禁用状态
function updateToastSettingsState(tabCloseEnabled) {
  const isDisabled = !tabCloseEnabled;
  enableToastCheckbox.disabled = isDisabled;
  toastDelaySlider.disabled = isDisabled;
  
  // 更新视觉样式
  const toastSection = document.querySelector('.settings-section:nth-child(3)');
  if (toastSection) {
    if (isDisabled) {
      toastSection.classList.add('disabled');
    } else {
      toastSection.classList.remove('disabled');
    }
  }
}

// 重置为默认设置
function resetToDefaults() {
  const confirmMsg = chrome.i18n.getMessage('resetConfirm');
  if (!confirm(confirmMsg)) {
    return;
  }
  
  // 更新UI
  enableTabCloseCheckbox.checked = DEFAULT_SETTINGS.enableTabClose;
  enableToastCheckbox.checked = DEFAULT_SETTINGS.enableToast;
  toastDelaySlider.value = DEFAULT_SETTINGS.toastDelay;
  updateToastDelayDisplay(DEFAULT_SETTINGS.toastDelay);
  
  // 保存到存储
  saveSettings(DEFAULT_SETTINGS);
}

// 打开Chrome快捷键设置页面
function openShortcutSettings() {
  chrome.tabs.create({
    url: 'chrome://extensions/shortcuts'
  });
}

// 事件监听器
enableTabCloseCheckbox.addEventListener('change', (e) => {
  const isEnabled = e.target.checked;
  saveSettings({ enableTabClose: isEnabled });
  updateToastSettingsState(isEnabled);
});

enableToastCheckbox.addEventListener('change', (e) => {
  saveSettings({ enableToast: e.target.checked });
});

toastDelaySlider.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  updateToastDelayDisplay(value);
});

toastDelaySlider.addEventListener('change', (e) => {
  const value = parseInt(e.target.value);
  saveSettings({ toastDelay: value });
});

resetBtn.addEventListener('click', resetToDefaults);

shortcutBtns.forEach(btn => {
  btn.addEventListener('click', openShortcutSettings);
});

// 页面加载时加载设置
initI18n();
updateToastDelayLabel(); // 初始化延迟标签
loadSettings();
