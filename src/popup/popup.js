const lastPingEl = document.getElementById('lastPing');
const totalPingsEl = document.getElementById('totalPings');
const refreshBtn = document.getElementById('refresh');

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'never';
  }
  return new Date(timestamp).toLocaleTimeString();
}

function updateStatus(status) {
  lastPingEl.textContent = formatTimestamp(status.lastPing);
  totalPingsEl.textContent = status.totalPings ?? 0;
}

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

refreshBtn.addEventListener('click', requestStatus);

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'background:status') {
    updateStatus(message.payload);
  }
});

requestStatus();
