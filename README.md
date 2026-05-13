# Voice to Text Pro 3.4

**Voice to Text Pro** is a Google Chrome extension for converting speech to text using the **Web Speech API**. It runs in the **Chrome Side Panel**, supports multilingual recognition, smart punctuation, browser spell check, text insertion into web pages, and a localized interface.

## Features

### Speech recognition

- 10 supported language options in settings, using BCP 47 language tags: Russian (ru-RU), English — United States (en-US), Ukrainian (uk-UA), Spanish (es-ES), French (fr-FR), German (de-DE), Italian (it-IT), Japanese (ja-JP), Korean (ko-KR), and Chinese — Simplified (zh-CN).
- Continuous recognition with automatic restart after recognition drops.
- Interim and final speech recognition results.
- Main workflow runs inside the **Chrome Side Panel**.
- The content script supports draft insertion into editable fields and tab-level recognition when needed.

### Smart punctuation

- Four punctuation modes: **Off**, **Low**, **Medium**, and **High**.
- Automatic capitalization after sentence endings: `.`, `?`, `!`, `:`, `;`, newline, and `…`.
- **High** mode uses language-specific question and exclamation patterns from `i18n.js`.
- The same punctuation rules are shared by both the side panel and the content script.

### UI localization

- The selected **recognition language** controls:
  - Web Speech API recognition language.
  - The textarea `lang` attribute.
  - Side panel UI strings loaded from `i18n.js`.
- The side panel applies localization through `applyAppLocale()` in `sidepanel.js`.
- Recording notifications and context menu labels are localized in `background.js` and use `chrome.storage.local.language`.
- Command descriptions in `manifest.json` are static Chrome manifest strings. Changing the side panel language does not dynamically change those descriptions.

### Text tools

- Insert recognized text into the currently focused field on a web page.
- Copy recognized text to clipboard.
- Clear the current draft.
- Store the current text draft locally.
- Use the context menu to paste saved text into editable fields.

### Spell check

- Built-in browser spell check is enabled for the text field.
- The text field language follows the selected recognition language.

### Interface

- Chrome Side Panel interface.
- Dark theme with animated background.
- Recording controls: **Start**, **Pause**, **Resume**, and **Stop**.
- Text actions: **Insert**, **Copy**, and **Clear**.
- Word counter.
- ARIA labels and live status region for accessibility.
- Close panel action.

## Keyboard shortcuts

| Shortcut              | Action                         |
| --------------------- | ------------------------------ |
| `Ctrl+Shift+1`        | Start recording                |
| `Ctrl+Shift+2`        | Stop recording                 |
| `Ctrl+Shift+I`        | Insert text into focused field |
| `Ctrl+Shift+9`        | Open / close side panel        |
| `Ctrl+C` in the field | Copy text                      |
| `Ctrl+Del`            | Clear text                     |

On macOS, Chrome uses `Command` instead of `Ctrl` where applicable. See `manifest.json` → `commands`.

## Installation

1. Download the release ZIP.
2. Extract the archive.
3. Open Chrome.
4. Go to `chrome://extensions/`.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select the extracted extension folder containing `manifest.json`.

## Usage

1. Click the extension icon to open the side panel.
2. Choose the recognition language.
3. Optionally select an AI punctuation mode.
4. Click **Start** or press `Ctrl+Shift+1`.
5. Speak into the microphone.
6. Use **Pause** to temporarily stop recognition without clearing text.
7. Use **Resume** to continue recording.
8. Use **Stop** to end the recognition session.
9. Use **Insert** to send the text into the focused field on the active page.
10. Use **Copy** or **Clear** when needed.

Draft text and settings are stored locally in `chrome.storage.local`.

## Supported languages

| Language                  | Code  |
| ------------------------- | ----- |
| Russian                   | ru-RU |
| English — United States   | en-US |
| Ukrainian                 | uk-UA |
| Spanish                   | es-ES |
| French                    | fr-FR |
| German                    | de-DE |
| Italian                   | it-IT |
| Japanese                  | ja-JP |
| Korean                    | ko-KR |
| Chinese — Simplified      | zh-CN |

## Local storage

The extension uses `chrome.storage.local` for local settings and draft persistence.

- `language` — selected BCP 47 language code; single source for recognition language and UI localization.
- `autoPunctuation` — punctuation level: `off`, `low`, `medium`, or `high`.
- `textDraft` — current side panel text draft.
- `sidePanelOpen` — side panel toggle state used by the extension.

## Project structure

Main files:

- `manifest.json` — Chrome Extension Manifest V3 configuration, permissions, side panel, commands, and content scripts.
- `background.js` — service worker for keyboard commands, context menu, notifications, paste flow, settings updates, and script injection.
- `sidepanel.html` — side panel markup; loads `i18n.js` before `sidepanel.js`.
- `sidepanel.js` — side panel logic, speech recognition, UI localization, settings persistence, and text actions.
- `i18n.js` — localized UI strings, language normalization, and punctuation patterns exposed through `globalThis.AppI18n`.
- `content.js` — page-side paste handling, editable field tracking, optional tab recognition, and punctuation support through `i18n.js`.
- `styles.css` — side panel styles and responsive UI rules.
- `icons/` — extension icons in 16, 48, and 128 px sizes.
- `README.md` — project overview and usage guide.
- `CHANGELOG.md` — version history.
- `CHECKLIST_VOICE_TO_TEXT_PRO.md` — release and manual testing checklist.

## Side panel and page integration

The extension separates the side panel from the active web page:

- The side panel handles recognition, draft editing, settings, and UI.
- The content script handles insertion into page fields.
- Draft text and language settings are shared through `chrome.storage.local`.
- If the active tab does not already have the content script, the service worker can inject `i18n.js` and `content.js` using the `scripting` permission.
- The context menu can paste the saved draft into editable fields.

## Troubleshooting

### Microphone access is not available

Check Chrome microphone permissions:

1. Open the page or extension.
2. Click the lock icon in the address bar.
3. Open site settings.
4. Allow microphone access.
5. Reload the page or extension.

### Recognition does not start

Check the following:

- Google Chrome supports the Web Speech API on the current system.
- Microphone access is allowed.
- A working microphone is connected.
- Network access is available.
- The selected language is supported by the browser speech recognition engine.

### Text does not insert

Try the following:

- Click inside an editable field before pressing **Insert**.
- Use a standard `input`, `textarea`, or `contenteditable` field.
- Some complex rich-text editors may block programmatic insertion.
- Reload the tab and try again.
- Use the context menu inside the editable field.

### The interface language did not change

Try the following:

- Change the language in the side panel again.
- Close and reopen the side panel.
- Reload the extension on `chrome://extensions/`.

## Tech stack

- Web Speech API: `SpeechRecognition` / `webkitSpeechRecognition`.
- Chrome Extensions Manifest V3.
- Chrome Side Panel API.
- `chrome.storage.local`.
- `chrome.scripting`.
- JavaScript ES6+.
- CSS with `prefers-reduced-motion` support.
- Standalone `i18n.js` with no DOM dependency, safe for future `importScripts()` use in a worker.

## Requirements

- Google Chrome with Manifest V3 support.
- Chrome Side Panel support.
- Recommended Chrome version: 114+.
- Microphone.
- Network access for speech recognition.

## Updating

After replacing extension files:

1. Open `chrome://extensions/`.
2. Find **Voice to Text Pro**.
3. Click **Reload**.
4. Reopen the side panel.

## Release ZIP

The release archive should include only the extension files required for installation.

It should not include:

- `.git/`
- `.vscode/`
- `node_modules/`
- temporary files
- backup files
- development-only archives

Recommended release archive name:

```text
Voice-to-Text-Pro-v3.4-release.zip
