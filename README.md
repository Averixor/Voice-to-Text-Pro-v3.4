# Voice to Text Pro 3.4

Google Chrome extension: speech to text via **Web Speech API**, **AI punctuation**, browser spell check, UI in the **Chrome Side Panel**.

## Features

### Speech recognition

- **10 languages** in settings (BCP-47): Russian (`ru-RU`), US English (`en-US`), Ukrainian (`uk-UA`), Spanish, French, German, Italian, Japanese, Korean, Chinese (`zh-CN`)
- Continuous capture with automatic recognition restart on drop
- Interim and final results
- Main flow: recognition in the **side panel**; **content script** on the page (draft paste and tab recording when needed)

### Smart punctuation

- Four levels: **Off**, **Low**, **Medium**, **High**
- Capitalization after sentence endings: `.` `?` `!` `:` `;` newline `…`
- **High** level uses **language-specific** question/exclamation patterns (`i18n.js` in both the panel and the content script)

### UI localization

- The **recognition language** list sets **Web Speech API language**, the text field **`lang` attribute**, and **the side panel UI strings** from `i18n.js` (`applyAppLocale()` in `sidepanel.js`). Locales **`ru-RU`** and **`uk-UA`** use **English** interface text while keeping Russian/Ukrainian speech and smart-punctuation rules.
- Chrome **recording-started** notification and **context menu** “paste draft” strings come from **`background.js`** using `chrome.storage.local.language`
- **Command descriptions** in `manifest.json` (`commands.description`) are **static** manifest strings; changing the panel UI language does not change them

### Spell check

- Built-in browser check for the textarea; language follows the selected input language

### Interface

- Side panel, dark theme, animated background
- Recording: **Start**, **Pause**, **Stop**; text actions: **Insert**, **Copy**, **Clear**; close panel
- Word stats, ARIA, live status region

### Keyboard shortcuts

| Shortcut              | Action                         |
| --------------------- | ------------------------------ |
| `Ctrl+Shift+1`        | Start recording                |
| `Ctrl+Shift+2`        | Stop recording                 |
| `Ctrl+Shift+I`        | Insert text into focused field |
| `Ctrl+Shift+9`        | Open / close side panel        |
| `Ctrl+C` in the field | Copy text                      |
| `Ctrl+Del`            | Clear text                     |

On macOS, `Command` is used instead of `Ctrl` (see `manifest.json` → `commands`).

## Installation

1. Clone or download the project folder (root contains `manifest.json`)
2. Open `chrome://extensions/`
3. Enable **Developer mode**
4. **Load unpacked** → select this folder

## Usage

1. Click the extension icon — the side panel opens (per Chrome default behavior)
2. Choose **language** — updates both recognition and panel UI
3. Optionally set **AI punctuation** level
4. **Start** or `Ctrl+Shift+1` — speak into the microphone
5. **Pause** — stops recognition without losing text; **Resume** continues recording
6. **Stop** — ends the recognition session
7. **Insert** — sends text to the focused field on the page (`input` / `textarea` / `contenteditable`)
8. Draft and settings are stored in **`chrome.storage.local`**

## Supported languages (recognition + panel UI)

| Language     | Code  |
| ------------ | ----- |
| Russian      | ru-RU |
| English (US) | en-US |
| Ukrainian    | uk-UA |
| Spanish      | es-ES |
| French       | fr-FR |
| German       | de-DE |
| Italian      | it-IT |
| Japanese     | ja-JP |
| Korean       | ko-KR |
| Chinese      | zh-CN |

## `chrome.storage.local` keys

- **`language`** — BCP-47 code; single source for UI and STT.
- **`autoPunctuation`** — Level: `off` / `low` / `medium` / `high`.
- **`textDraft`** — Panel text draft.
- **`sidePanelOpen`** — Flag for hotkey side panel toggle.

## Project layout (main files)

- **`manifest.json`** — MV3 manifest, permissions, side panel, content scripts, commands.
- **`background.js`** — Service worker: commands, menu, notifications, paste, `updateSettings`.
- **`sidepanel.html`** — Panel markup; loads `i18n.js`, `sidepanel.js`.
- **`sidepanel.js`** — Panel logic, recognition, `applyAppLocale()`, settings persistence.
- **`i18n.js`** — UI strings + punctuation regex; `globalThis.AppI18n`.
- **`content.js`** — Paste; optional tab recognition; punctuation via `i18n.js`.
- **`styles.css`** — Panel styles.
- **`icons/`** — 16, 48, 128 icons.

## Side panel vs page

- The panel does not cover the whole page; draft and language are shared via storage
- **Context menu** on editable fields: paste saved draft; if the tab has no content script, the service worker may **inject** `i18n.js` and `content.js` (`scripting` permission)

## Troubleshooting

### No microphone access

See the in-panel instructions: lock icon in the address bar → site settings → microphone → reload.

### Recognition not working

- **Network** required (Chrome’s cloud-backed Web Speech API)
- Working microphone and site/extension permission

### Text does not insert

- Focus an input field; some sites (rich editors) may block insertion

## Tech stack

- **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Chrome Extensions Manifest V3**
- **Side Panel API**
- **`chrome.storage.local`**, **`chrome.scripting`** (inject on paste)
- **CSS** (including `prefers-reduced-motion`)
- **ES6+**; **`i18n.js`** has no DOM dependency (safe for `importScripts` in a worker)

## Requirements

- **Google Chrome** with Side Panel + MV3 (target **114+**)
- Microphone
- Network for speech recognition

## Updating

In `chrome://extensions/`, click **Reload** on the extension card after replacing files.

## License

MIT License

## Author

[Averixor](https://github.com/Averixor)

## Version history

See **`CHANGELOG.md`**. Current version in **`manifest.json`**: **3.4**.
