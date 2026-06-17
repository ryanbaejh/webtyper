# Webtyper — Style Guide & Design Reference

The single source of truth for Webtyper's visual design: color tokens, typography,
component specs, and the conventions to follow so new features stay consistent.

If you add a screen, widget, or injected element, **use the tokens below** — don't
hardcode hex values. When a value must be hardcoded (e.g. inside an injected
content-script element, see [Injected UI](#injected-content-script-ui)), copy the
exact token value from the tables here and leave a `/* = popup --token */` comment.

---

## Theming model

Two themes: **light** (default) and **dark**. The active theme is expressed as a
`data-theme` attribute and the CSS resolves tokens from it.

| Surface | Where theme is applied | How |
| --- | --- | --- |
| Popup (`popup.html`) | `<html>` | `popup.js` sets `data-theme` before first paint |
| Settings (`settings.html`) | `<html>` | `settings.js` sets `data-theme` before first paint |
| Injected overlay / HUD (`content.js`) | the injected element itself | `content.js` sets `data-theme="…"` on `.webtyper-overlay` / `.webtyper-hud` from its `currentTheme` |

**Persistence:** the theme string (`"light"` | `"dark"`) is stored in
`localStorage["webtyper-theme"]` (synchronous, read before first paint to avoid a
flash) **and** mirrored to `chrome.storage.sync.theme` (cross-device). The content
script keeps a `currentTheme` variable in sync via `chrome.storage.onChanged`.

In CSS, **light is the `:root` default** for page UIs (popup/settings). For the
injected elements the convention is inverted for historical reasons: **dark is the
base rule** and `[data-theme="light"]` is the override. Either way, never assume a
theme — always pull from a token.

---

## Color tokens

Defined in `popup.css` (`:root` + `[data-theme="dark"]`). `settings.css` carries the
same palette (with a few component-specific extras). **`popup.css` is canonical** —
if the two ever disagree, popup.css wins.

### Core palette

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | `#f9f5f0` | `#12121f` | Page background (⚠ now unused in popup.css — see note) |
| `--surface` | `#fffefb` | `#1a1a30` | Cards & raised surfaces — **the popup body, overlay card, and HUD all use this** |
| `--surface-hover` | `#f0ebe2` | `#16162a` | Hover state on surfaces |
| `--border` | `#e8e0d4` | `#2a2a45` | Default borders, card edges |
| `--border-strong` | `#d4c8b8` | `#3a3a55` | Emphasized borders, hover |
| `--text` | `#1e1c1a` | `#e2e2f0` | Primary text **and all stat values** |
| `--text-muted` | `#6a6058` | `#888` | Secondary text |
| `--text-faint` | `#a09488` | `#555` | Tertiary text **and all stat labels** |
| `--accent` | `#f1d6b8` | `#4a90d9` | Primary action (buttons), highlights |
| `--accent-fg` | `#2a1800` | `#fff` | Text/icon on an accent background |
| `--accent-border` | `#c9a06a` | transparent | Border on accent elements |
| `--accent-soft` | `rgba(241,214,184,0.35)` | `rgba(74,144,217,0.08)` | Low-opacity accent fill (selected rows) |
| `--success` | `#2d8a50` | `#5db87a` | Success — the "Session Complete" title |
| `--danger` | `#c94040` | `#c94040` | Destructive actions (End) |
| `--stat-bg` | `#f0ebe2` | `#12121f` | Stat cell background |
| `--stat-border` | `#e0d8cc` | `#252540` | Stat cell border |

### Component-specific tokens

`popup.css` only — secondary/ghost buttons:

| Token | Light | Dark |
| --- | --- | --- |
| `--btn-2-bg` / `--btn-2-text` / `--btn-2-border` | `#ede8e0` / `#3a3428` / `#d8d0c4` | `#1e1e35` / `#b0b0cc` / `#2a2a45` |
| `--btn-ghost-border` / `--btn-ghost-text` | `#d4c8b8` / `#6a6058` | `#2a2a45` / `#666` |

`settings.css` only — selectable action chips:

| Token | Light | Dark |
| --- | --- | --- |
| `--chip-border` / `--chip-text` | `#dbd4c8` / `#7a7060` | `#222238` / `#4a4a6a` |
| `--chip-hover-border` / `--chip-hover-text` | `#bdb2a4` / `#3a3428` | `#44445a` / `#888` |

> **Note — `--bg` is unused in `popup.css`.** The popup body was switched to
> `--surface` so it matches the overlay/HUD white. The `--bg` token is left defined
> for palette completeness. `settings.css` still uses `--bg` for its full-page
> background, and its `--bg` differs slightly (`#f3efe8` light / `#0e0e1a` dark) —
> intentional, because the settings page is a large flat page rather than a card.

---

## Token usage map — completion screens & live stats

The popup's complete view, the injected completion overlay, and the live HUD are
**the same design** rendered in three places. They must resolve to identical colors.
This is the table to check whenever you touch any of them.

| Area | Light | Dark | Token |
| --- | --- | --- | --- |
| Screen / card background | `#fffefb` | `#1a1a30` | `--surface` |
| Card border *(overlay & HUD; popup is a borderless window)* | `#e8e0d4` | `#2a2a45` | `--border` |
| Title ("Session Complete") | `#2d8a50` | `#5db87a` | `--success` |
| Stat cell background | `#f0ebe2` | `#12121f` | `--stat-bg` |
| Stat cell border | `#e0d8cc` | `#252540` | `--stat-border` |
| Stat value (number) | `#1e1c1a` | `#e2e2f0` | `--text` |
| Stat label | `#a09488` | `#555` | `--text-faint` |
| Button background | `#f1d6b8` | `#4a90d9` | `--accent` |
| Button text | `#2a1800` | `#fff` | `--accent-fg` |
| Button border | `#c9a06a` | transparent | `--accent-border` |

In the injected files these map to local mirror variables: `--ov-*` on
`.webtyper-overlay` and `--hud-*` on `.webtyper-hud`. Keep the `/* = popup --token */`
comments accurate when editing.

**Stat order is fixed:** `WPM · Accuracy · Mistakes · Characters` (completion) and
`WPM · Accuracy · Mistakes · Time` (live HUD). Keep these consistent across surfaces.

---

## Typography

- **Font stack (everywhere):**
  `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  On Windows this resolves to **Segoe UI**.
- **Numbers:** use `font-variant-numeric: tabular-nums` on anything that updates live
  (the HUD) so digits don't shift width.

| Element | Size | Weight | Color | Notes |
| --- | --- | --- | --- | --- |
| Title ("Session Complete") | 13px | 700 | `--success` | |
| Stat value — popup & overlay | 20px | 700 | `--text` | |
| Stat value — HUD | 14px | 700 | `--text` | smaller; corner widget |
| Stat label | 10px | 600 | `--text-faint` | UPPERCASE, `letter-spacing: 0.6px` |
| Button | 13px | 600 | `--accent-fg` | |

---

## Components

### Stat cell
`background: --stat-bg; border: 1px solid --stat-border; border-radius: 8px;
padding: 10px 8px; text-align: center;`

### Button (primary)
`background: --accent; color: --accent-fg; border: 1px solid --accent-border;
border-radius: 7px; padding: 9px 14px; font: 600 13px; line-height: 1;`
Hover: `filter: brightness(1.08)`.

### Completion screen
A 2×2 grid of stat cells (`gap: 8px`), a `--success` title above, a full-width
primary button below. Rendered in the popup (`#view-complete`) and as the injected
`.webtyper-overlay` card (radius 14px, padding 28px 32px, on a dark scrim).

### Live stats HUD
Injected `.webtyper-hud`, pinned **top-right** (`top:16px; right:16px`). Deliberately
**flat and text-only**: `--surface` background, 1px `--border`, **no shadow, no accent
color**. Label/value rows (`flex`, `space-between`). Non-interactive
(`pointer-events: none`). Shown while a session is `active`; controlled by the
`liveStats` setting (default **on**).

---

## Injected (content-script) UI

Elements injected onto arbitrary host pages (`.webtyper-overlay`, `.webtyper-hud`,
char spans, cursor) must defend against the host page's CSS:

1. **`!important` on every property.** Host rules frequently target `div`/`span`/`p`.
2. **Force the font on the element AND all descendants:**
   `.webtyper-x, .webtyper-x * { font-family: <stack> !important; box-sizing: border-box !important; }`
   `!important` on a parent does **not** protect children — a host rule matching a
   child directly still overrides the *inherited* value. This bit us before; always
   include the `* ` selector.
3. **Theme via `data-theme` on the element**, set from `currentTheme` in JS. Dark is
   the base rule; `[data-theme="light"]` overrides.
4. **Mirror popup tokens** into local `--ov-*` / `--hud-*` variables; don't invent new
   colors.

### Z-index / layering
| Element | z-index |
| --- | --- |
| Completion overlay | `2147483647` (max) |
| Live stats HUD | `2147483646` (just below) |

---

## Gotchas

- **Content-script changes need a reload.** CSS/JS injected by the content script is
  bound at page load. After editing `content.css` / `content.js`, **reload the
  extension at `chrome://extensions` AND refresh the tab.** The popup/settings pick up
  changes as soon as the extension is reloaded.
- **Focus & the action popup.** A browser-action popup closes the instant it loses
  focus, and typing into the page requires the page to have focus — so the popup and
  page-typing are mutually exclusive. That's why "Start Highlighted Text" closes the
  popup (immediate typing) and why live stats live in the injected HUD, not the popup.

---

## Changelog

Notable design/UX decisions, newest first. Keep entries short; link the why.

### 2026-06-17
- **Live stats HUD** added — flat, text-only, top-right corner; shows
  WPM/Accuracy/Mistakes/Time live during a session. New `liveStats` setting (default
  on) toggles it. Chosen over keeping the popup open (impossible — see Gotchas).
- **Instant typing** — "Start Highlighted Text" now closes the popup so keyboard
  focus returns to the page; no second click needed.
- **Popup background → `--surface`** (`#fffefb` / `#1a1a30`) to match the overlay card
  and HUD. `--bg` retired from popup.css.
- **Stat labels standardized to `--text-faint`** across popup, overlay, and HUD.
- **Completion overlay rebuilt to mirror popup tokens & component specs** — added stat
  cell borders, matched sizes/weights/spacing, fixed stat order to
  WPM·Accuracy·Mistakes·Characters, and themed it light/dark (was hardcoded dark).
- **Stat values use `--text`** (readable black/white) instead of an accent-colored WPM.
