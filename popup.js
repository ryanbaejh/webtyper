// Apply theme before first paint (localStorage is synchronous)
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('typeover-theme') || 'light'
);

let pollTimer = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function show(id) {
  ['view-idle', 'view-selecting', 'view-active', 'view-complete'].forEach(v => {
    document.getElementById(v).classList.toggle('hidden', v !== id);
  });
}

async function tabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.id ?? null;
}

async function send(msg) {
  const id = await tabId();
  if (!id) return null;
  try {
    return await chrome.tabs.sendMessage(id, msg);
  } catch {
    return null;
  }
}

// ── Stats display ─────────────────────────────────────────────────────────────

function fillActive(stats) {
  document.getElementById('s-wpm').textContent  = stats.wpm;
  document.getElementById('s-acc').textContent  = stats.accuracy + '%';
  document.getElementById('s-err').textContent  = stats.mistakes;
  document.getElementById('s-time').textContent = stats.time + 's';
}

function fillComplete(stats) {
  document.getElementById('c-wpm').textContent   = stats.wpm;
  document.getElementById('c-acc').textContent   = stats.accuracy + '%';
  document.getElementById('c-err').textContent   = stats.mistakes;
  document.getElementById('c-chars').textContent = stats.charsTyped;
}

// ── Polling ───────────────────────────────────────────────────────────────────

function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    const res = await send({ type: 'GET_STATUS' });
    if (!res) { stopPolling(); show('view-idle'); return; }
    if (res.mode === 'active')   { fillActive(res.stats); }
    if (res.mode === 'complete') { stopPolling(); fillComplete(res.stats); show('view-complete'); }
    if (res.mode === 'idle')     { stopPolling(); show('view-idle'); }
  }, 500);
}

function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
}

// ── Buttons ───────────────────────────────────────────────────────────────────

document.getElementById('btn-quick-start').addEventListener('click', async () => {
  const res = await send({ type: 'START_QUICK_SELECT' });
  if (res?.ok) window.close();
});

document.getElementById('btn-highlight').addEventListener('click', async () => {
  const res = await send({ type: 'START_HIGHLIGHT' });
  if (!res) return;
  if (res.ok) {
    show('view-active');
    startPolling();
  } else {
    // Brief shake to signal no selection
    const btn = document.getElementById('btn-highlight');
    btn.style.outline = '2px solid #e05555';
    btn.textContent = 'Highlight text first';
    setTimeout(() => {
      btn.style.outline = '';
      btn.textContent = 'Start Highlighted Text';
    }, 1800);
  }
});

document.getElementById('btn-cancel').addEventListener('click', async () => {
  await send({ type: 'END_SESSION' });
  show('view-idle');
});

document.getElementById('btn-end').addEventListener('click', async () => {
  await send({ type: 'END_SESSION' });
  // Keep polling — it will detect mode='complete' and switch to the complete view
});

document.getElementById('btn-reset').addEventListener('click', async () => {
  stopPolling();
  await send({ type: 'RESET' });
  show('view-idle');
});

document.getElementById('btn-new').addEventListener('click', async () => {
  await send({ type: 'RESET' }); // dismiss overlay on the page
  show('view-idle');
});

document.getElementById('btn-settings').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// ── Init ──────────────────────────────────────────────────────────────────────

(async () => {
  const res = await send({ type: 'GET_STATUS' });
  if (!res) { show('view-idle'); return; }

  if (res.mode === 'active') {
    fillActive(res.stats);
    show('view-active');
    startPolling();
  } else if (res.mode === 'complete') {
    fillComplete(res.stats);
    show('view-complete');
  } else if (res.mode === 'selecting') {
    show('view-selecting');
  } else {
    show('view-idle');
  }
})();
