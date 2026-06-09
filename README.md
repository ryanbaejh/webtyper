# TypeOver

A Chrome extension that turns any webpage into a typing test. Practice typing using real content from articles, Wikipedia, news — whatever you're already reading.

## How it works

TypeOver greys out the text on the page. As you type, each character is revealed at full opacity. Mistakes are highlighted in red. When you finish, a stats overlay shows your WPM, accuracy, time, and mistake count.

## Features

- **Quick Start** — hover over any text block, click to start
- **Highlight Mode** — select exactly the text you want to type, then start
- **Live stats** — WPM, accuracy, mistakes, and elapsed time in the popup while you type
- **Session complete overlay** — shown on the page when you finish or press End
- **Special character handling** — skip or replace hard-to-type characters (em dashes, smart quotes, footnotes, IPA symbols, etc.)
- **Light and dark mode** — warm beige light theme and dark navy dark theme, switchable in settings

## Installation

TypeOver is not published to the Chrome Web Store. Load it as an unpacked extension:

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the project folder
5. The TypeOver icon will appear in your toolbar

After making any code changes, click the refresh icon on the extension card at `chrome://extensions` to reload it.

## Usage

### Quick Start

1. Click the TypeOver icon in the toolbar
2. Click **Quick Start** — the cursor changes to a crosshair
3. Hover over a paragraph or block of text (it will highlight in blue)
4. Click to start the session

### Highlight Mode

1. Select the exact text you want to type on the page
2. Click the TypeOver icon
3. Click **Start Highlighted Text**

### During a session

| Key | Action |
|-----|--------|
| Type normally | Advance through the text |
| `Backspace` | Undo the last character |
| `Escape` | End the session and show stats |
| `Escape` (again) | Dismiss the stats and restore the page |

The popup shows live WPM and accuracy while you type. Click **End** to stop early and see stats, or **Reset** to cancel without stats.

## Settings

Click the **⚙** icon in the popup header, or go to `chrome://extensions` → TypeOver → Details → Extension options.

### Appearance

Toggle between **Light** (warm beige) and **Dark** (dark navy) themes. The change applies instantly.

### Special Characters

Choose how TypeOver handles characters that aren't on a standard keyboard:

| Mode | Behaviour |
|------|-----------|
| Keep everything | Type every character exactly as it appears |
| Skip non-keyboard | Cursor advances automatically past anything not on a standard keyboard |
| Advanced | Configure each category individually |

**Advanced categories:**

| Category | Examples | Options |
|----------|----------|---------|
| Em dash | — | Skip, Replace with `-`, Keep |
| En dash | – | Skip, Replace with `-`, Keep |
| Smart quotes | " " ' ' | Skip, Replace with `"` `'`, Keep |
| Ellipsis | … | Skip, Keep |
| Non-breaking space | `&nbsp;` | Skip, Replace with space, Keep |
| Footnotes & superscripts | Text inside `<sup>`/`<sub>` | Skip, Keep |
| Accented letters | é ñ ü | Skip, Replace with base letter, Keep |
| IPA / phonetic | ə æ ɪ | Skip, Keep |
| Other symbols | © ™ × | Skip, Keep |

**Replace** means you type a simpler equivalent — the page still shows the original character, but you type the keyboard-friendly version. Character settings are saved with the **Save Settings** button; theme changes save automatically.

## File structure

```
manifest.json      Chrome extension manifest (MV3)
content.js         All typing logic, injected into every page
content.css        In-page styles (pending, correct, incorrect, cursor, overlay)
popup.html/css/js  Extension popup (idle, selecting, active, complete views)
settings.html/css/js  Settings page
icons/icon.svg     Extension icon
```
