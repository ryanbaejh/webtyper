const DEFAULT_SETTINGS = {
  mode: 'advanced',
  advanced: {
    emDash:      'replace',
    enDash:      'replace',
    smartQuotes: 'replace',
    ellipsis:    'skip',
    nbSpace:     'replace',
    footnotes:   'skip',
    accented:    'keep',
    ipa:         'skip',
    other:       'skip',
  }
};

const ADVANCED_KEYS = ['emDash','enDash','smartQuotes','ellipsis','nbSpace','footnotes','accented','ipa','other'];

async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get('settings');
    return result.settings ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function applyToForm(settings) {
  const modeEl = document.querySelector(`input[name="mode"][value="${settings.mode}"]`);
  if (modeEl) modeEl.checked = true;

  for (const key of ADVANCED_KEYS) {
    const val = settings.advanced?.[key] ?? DEFAULT_SETTINGS.advanced[key];
    const el = document.querySelector(`input[name="${key}"][value="${val}"]`);
    if (el) el.checked = true;
  }

  updateAdvancedVisibility(settings.mode);
}

function updateAdvancedVisibility(mode) {
  document.getElementById('advanced-panel').classList.toggle('hidden', mode !== 'advanced');
}

function collectFromForm() {
  const modeEl = document.querySelector('input[name="mode"]:checked');
  const mode = modeEl?.value ?? 'advanced';

  const advanced = {};
  for (const key of ADVANCED_KEYS) {
    const el = document.querySelector(`input[name="${key}"]:checked`);
    advanced[key] = el?.value ?? DEFAULT_SETTINGS.advanced[key];
  }

  return { mode, advanced };
}

document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => updateAdvancedVisibility(radio.value));
});

document.getElementById('btn-save').addEventListener('click', async () => {
  const settings = collectFromForm();
  await chrome.storage.sync.set({ settings });

  const status = document.getElementById('save-status');
  status.textContent = 'Saved!';
  status.classList.add('visible');
  setTimeout(() => status.classList.remove('visible'), 2000);
});

(async () => {
  const settings = await loadSettings();
  applyToForm(settings);
})();
