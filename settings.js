// Apply theme synchronously before first paint
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('webtyper-theme') || 'light'
);

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

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('webtyper-theme', theme);
  chrome.storage.sync.set({ theme }).catch(() => {});
}

function applyToForm(settings, theme) {
  const themeEl = document.querySelector(`input[name="theme"][value="${theme}"]`);
  if (themeEl) themeEl.checked = true;

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

function collectSettings() {
  const modeEl = document.querySelector('input[name="mode"]:checked');
  const mode = modeEl?.value ?? 'advanced';

  const advanced = {};
  for (const key of ADVANCED_KEYS) {
    const el = document.querySelector(`input[name="${key}"]:checked`);
    advanced[key] = el?.value ?? DEFAULT_SETTINGS.advanced[key];
  }

  return { mode, advanced };
}

// Theme changes apply immediately
document.querySelectorAll('input[name="theme"]').forEach(radio => {
  radio.addEventListener('change', () => applyTheme(radio.value));
});

// Mode changes show/hide advanced panel
document.querySelectorAll('input[name="mode"]').forEach(radio => {
  radio.addEventListener('change', () => updateAdvancedVisibility(radio.value));
});

// Save button persists character settings
document.getElementById('btn-save').addEventListener('click', async () => {
  const settings = collectSettings();
  await chrome.storage.sync.set({ settings }).catch(() => {});

  const status = document.getElementById('save-status');
  status.textContent = 'Saved!';
  status.classList.add('visible');
  setTimeout(() => status.classList.remove('visible'), 2000);
});

// Init — load both settings and theme from storage
(async () => {
  const [sr, tr] = await Promise.all([
    chrome.storage.sync.get('settings').catch(() => ({})),
    chrome.storage.sync.get('theme').catch(() => ({})),
  ]);

  const settings = sr.settings ?? DEFAULT_SETTINGS;
  const theme = tr.theme ?? localStorage.getItem('webtyper-theme') ?? 'light';

  // Keep localStorage in sync with storage
  localStorage.setItem('webtyper-theme', theme);
  document.documentElement.setAttribute('data-theme', theme);

  applyToForm(settings, theme);
})();
