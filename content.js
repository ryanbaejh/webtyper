(() => {
  if (window.__typeOverLoaded) return;
  window.__typeOverLoaded = true;

  // ── State ──────────────────────────────────────────────────────────────────

  const state = {
    mode: 'idle', // 'idle' | 'selecting' | 'active' | 'complete'
    chars: [],    // [{ expected, state, span }]
    cursor: 0,
    startTime: null,
    correctCount: 0,
    mistakeCount: 0,
    totalTyped: 0,
    container: null,
    savedHTML: null,
  };

  let cursorSpan = null;
  let hoverTarget = null;
  let overlayEl = null;

  // ── Selection Mode ─────────────────────────────────────────────────────────

  function enterSelectionMode() {
    state.mode = 'selecting';
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', onHover);
    document.addEventListener('mouseout', onHoverOut);
    document.addEventListener('click', onSelectClick, true);
  }

  function exitSelectionMode() {
    document.body.style.cursor = '';
    document.removeEventListener('mouseover', onHover);
    document.removeEventListener('mouseout', onHoverOut);
    document.removeEventListener('click', onSelectClick, true);
    if (hoverTarget) {
      hoverTarget.classList.remove('typeover-highlight');
      hoverTarget = null;
    }
  }

  function onHover(e) {
    const el = findContainer(e.target);
    if (hoverTarget && hoverTarget !== el) {
      hoverTarget.classList.remove('typeover-highlight');
    }
    if (el) {
      el.classList.add('typeover-highlight');
      hoverTarget = el;
    } else {
      hoverTarget = null;
    }
  }

  function onHoverOut() {
    if (hoverTarget) {
      hoverTarget.classList.remove('typeover-highlight');
      hoverTarget = null;
    }
  }

  function onSelectClick(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = findContainer(e.target);
    exitSelectionMode();
    if (el) {
      startSession(el);
    } else {
      state.mode = 'idle';
    }
  }

  const BLOCK_TAGS = new Set(['P','DIV','ARTICLE','SECTION','LI','BLOCKQUOTE','TD','TH','H1','H2','H3','H4','H5','H6','MAIN','HEADER','FOOTER','FIGURE']);

  function findContainer(el) {
    let node = el;
    while (node && node !== document.body) {
      if (BLOCK_TAGS.has(node.tagName)) {
        const text = node.innerText?.trim() ?? '';
        if (text.length >= 20) return node;
      }
      node = node.parentElement;
    }
    if (el.innerText?.trim().length >= 20) return el;
    return null;
  }

  // ── Session ────────────────────────────────────────────────────────────────

  function startSession(container) {
    state.container = container;
    state.savedHTML = container.innerHTML;

    const chars = wrapChars(container);
    if (chars.length === 0) {
      restore();
      state.mode = 'idle';
      return;
    }

    state.chars = chars;
    state.cursor = 0;
    state.startTime = null;
    state.correctCount = 0;
    state.mistakeCount = 0;
    state.totalTyped = 0;
    state.mode = 'active';

    moveCursor(0);
  }

  // Show stats overlay — called on natural completion OR manual End
  function endSession() {
    if (state.mode === 'selecting') {
      exitSelectionMode();
      state.mode = 'idle';
      return;
    }
    if (state.mode === 'idle') return;
    if (state.mode === 'complete') { cleanupSession(); return; }
    // active → show stats instead of silently ending
    state.mode = 'complete';
    removeCursor();
    showOverlay(getStats());
  }

  // Full teardown — called from Done button, Reset, or starting a new session
  function cleanupSession() {
    state.mode = 'idle';
    removeCursor();
    dismissOverlay();
    restore();
  }

  function completeSession() {
    state.mode = 'complete';
    removeCursor();
    showOverlay(getStats());
  }

  function restore() {
    if (state.container && state.savedHTML !== null) {
      state.container.innerHTML = state.savedHTML;
    }
    state.container = null;
    state.savedHTML = null;
    state.chars = [];
    state.cursor = 0;
  }

  // ── Text Wrapping ──────────────────────────────────────────────────────────

  function wrapChars(element) {
    const chars = [];
    const SKIP = new Set(['SCRIPT','STYLE','NOSCRIPT','IFRAME','INPUT','TEXTAREA','SELECT','BUTTON']);

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text.trim()) return;

        const frag = document.createDocumentFragment();
        for (const ch of text) {
          // Normalize newlines/tabs to space — browsers collapse them visually
          // but e.key never equals '\n' or '\t', which would strand the cursor
          const expected = /[\n\r\t]/.test(ch) ? ' ' : ch;
          const span = document.createElement('span');
          span.className = 'typeover-char typeover-pending';
          span.textContent = ch;
          frag.appendChild(span);
          chars.push({ expected, state: 'pending', span });
        }
        node.parentNode.replaceChild(frag, node);

      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP.has(node.tagName)) return;
        if (node.isContentEditable) return;
        Array.from(node.childNodes).forEach(walk);
      }
    }

    walk(element);
    return chars;
  }

  // ── Cursor ─────────────────────────────────────────────────────────────────

  function moveCursor(index) {
    removeCursor();
    if (index >= state.chars.length) return;
    cursorSpan = document.createElement('span');
    cursorSpan.className = 'typeover-cursor';
    const target = state.chars[index].span;
    target.parentNode.insertBefore(cursorSpan, target);
  }

  function removeCursor() {
    if (cursorSpan) { cursorSpan.remove(); cursorSpan = null; }
  }

  // ── Keyboard ───────────────────────────────────────────────────────────────

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (state.mode === 'selecting') { exitSelectionMode(); state.mode = 'idle'; }
      else if (state.mode === 'active') endSession();     // show overlay
      else if (state.mode === 'complete') cleanupSession(); // dismiss overlay
      return;
    }

    if (state.mode !== 'active') return;

    const t = e.target;
    if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    e.preventDefault();
    e.stopPropagation();

    if (!state.startTime) state.startTime = Date.now();

    if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key.length === 1) {
      handleChar(e.key);
    }
  }, true);

  function handleChar(typed) {
    if (state.cursor >= state.chars.length) return;
    const c = state.chars[state.cursor];
    state.totalTyped++;

    if (typed === c.expected) {
      c.state = 'correct';
      c.span.className = 'typeover-char typeover-correct';
      state.correctCount++;
    } else {
      c.state = 'incorrect';
      c.span.className = 'typeover-char typeover-incorrect';
      state.mistakeCount++;
    }

    state.cursor++;
    if (state.cursor >= state.chars.length) {
      completeSession();
    } else {
      moveCursor(state.cursor);
    }
  }

  function handleBackspace() {
    if (state.cursor === 0) return;
    state.cursor--;
    const c = state.chars[state.cursor];

    if (c.state === 'correct') state.correctCount--;
    else if (c.state === 'incorrect') state.mistakeCount--;
    if (c.state !== 'pending') state.totalTyped--;

    c.state = 'pending';
    c.span.className = 'typeover-char typeover-pending';
    moveCursor(state.cursor);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  function getStats() {
    const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
    const minutes = elapsed / 60;
    const wpm = minutes > 0 ? Math.round((state.correctCount / 5) / minutes) : 0;
    const accuracy = state.totalTyped > 0
      ? Math.round((state.correctCount / state.totalTyped) * 100)
      : 100;
    return {
      wpm,
      accuracy,
      time: Math.round(elapsed),
      mistakes: state.mistakeCount,
      charsTyped: state.totalTyped,
      correctChars: state.correctCount,
    };
  }

  // ── Completion Overlay ─────────────────────────────────────────────────────

  function showOverlay(stats) {
    dismissOverlay();
    overlayEl = document.createElement('div');
    overlayEl.className = 'typeover-overlay';

    const box = document.createElement('div');
    box.className = 'typeover-overlay-box';

    const title = document.createElement('p');
    title.className = 'typeover-overlay-title';
    title.textContent = 'Session Complete';

    const grid = document.createElement('div');
    grid.className = 'typeover-overlay-grid';

    [
      [stats.wpm,        'WPM'],
      [stats.accuracy + '%', 'Accuracy'],
      [stats.charsTyped, 'Characters'],
      [stats.mistakes,   'Mistakes'],
    ].forEach(([val, lbl]) => {
      const cell = document.createElement('div');
      cell.className = 'typeover-overlay-stat';
      const v = document.createElement('span');
      v.className = 'typeover-overlay-val';
      v.textContent = val;
      const l = document.createElement('span');
      l.className = 'typeover-overlay-lbl';
      l.textContent = lbl;
      cell.appendChild(v);
      cell.appendChild(l);
      grid.appendChild(cell);
    });

    const btn = document.createElement('button');
    btn.className = 'typeover-overlay-btn';
    btn.textContent = 'Done';
    btn.addEventListener('click', cleanupSession);

    box.appendChild(title);
    box.appendChild(grid);
    box.appendChild(btn);
    overlayEl.appendChild(box);
    document.body.appendChild(overlayEl);
  }

  function dismissOverlay() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
  }

  // ── Message Bridge ─────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    switch (msg.type) {

      case 'START_QUICK_SELECT':
        if (state.mode !== 'idle') cleanupSession();
        enterSelectionMode();
        sendResponse({ ok: true });
        break;

      case 'START_HIGHLIGHT': {
        if (state.mode !== 'idle') cleanupSession();
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          sendResponse({ ok: false, reason: 'no-selection' });
          break;
        }
        const range = sel.getRangeAt(0);
        let node = range.startContainer;
        let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        // Walk up to nearest block element
        while (el && el !== document.body && !BLOCK_TAGS.has(el.tagName)) {
          el = el.parentElement;
        }
        if (!el || el === document.body) {
          el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
        }
        sel.removeAllRanges();
        startSession(el);
        sendResponse({ ok: true });
        break;
      }

      case 'END_SESSION':
        endSession();
        sendResponse({ ok: true });
        break;

      case 'RESET':
        cleanupSession();
        sendResponse({ ok: true });
        break;

      case 'GET_STATUS':
        sendResponse({ mode: state.mode, stats: getStats() });
        break;
    }
    return true;
  });

})();
