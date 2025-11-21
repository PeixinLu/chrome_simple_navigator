const messageInput = document.getElementById('message');
const saveButton = document.getElementById('save');
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text;
  setTimeout(() => {
    statusEl.textContent = '\u00A0';
  }, 2000);
}

async function loadSettings() {
  const { friendlyMessage = 'Hello world' } = await chrome.storage.sync.get('friendlyMessage');
  messageInput.value = friendlyMessage;
}

async function saveSettings() {
  const friendlyMessage = messageInput.value.trim();
  await chrome.storage.sync.set({ friendlyMessage });
  setStatus('Saved.');
}

saveButton.addEventListener('click', saveSettings);

document.addEventListener('DOMContentLoaded', loadSettings);
