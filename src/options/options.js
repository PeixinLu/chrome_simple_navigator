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
const toastDelayValue = document.getElementById('toastDelayValue');
const resetBtn = document.getElementById('resetBtn');
const saveIndicator = document.getElementById('saveIndicator');
const shortcutBtns = document.querySelectorAll('.shortcut-btn');

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
  toastDelayValue.textContent = (value / 1000).toFixed(1);
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
  if (!confirm('Are you sure you want to reset all settings to defaults?')) {
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
loadSettings();
