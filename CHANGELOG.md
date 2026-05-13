# Changelog

## 3.4 — 2026-05-12

### Added

- **Pause** button — pauses recognition while keeping text; **Start** becomes **Resume**.
- `showTransientStatus()` — transient status line messages without resetting recording / pause mode.
- Standard **`SpeechRecognition`** fallback (from `webkitSpeechRecognition`) in the side panel.
- **`.visually-hidden`** for the hidden `<label>` on the text field.
- **ARIA**: `role="status"`, `aria-live="polite"`, `aria-hidden` on decorative nodes, `aria-label` on close, `role="dialog"` on microphone instructions.
- **`i18n.js`** — UI strings and smart-punctuation regex (`punctQuestionRe` / `punctExclaimRe`) for ten locales; exported as `globalThis.AppI18n` (side panel, content script, and optional service worker via `importScripts`).
- **Panel localization**: the selected recognition language drives the whole side panel UI (`applyAppLocale()` in `sidepanel.js`).
- **`background.js` localization**: recording-started notification title/body and context-menu “paste draft” depend on `chrome.storage.local.language`; menu title updates on language change (`chrome.contextMenus.update` with fallback to `createOrRefreshContextMenu` on error).
- **`scripting` permission** in `manifest.json`: when pasting from the context menu, if the tab has no content script, `background.js` injects `i18n.js` and `content.js` via `chrome.scripting.executeScript` (`sendPasteToTab`).

### Fixed

- **Close panel** — previously broken because `sender.tab` is always `undefined` for the side panel and `chrome.sidePanel.setOptions()` was not called. Now `window.close()` plus active-tab lookup in `background.js`.
- **Auto-capitalization** — uppercase after a period failed because `this.output.value.slice(-1)` returned a space, not `.`. Now uses `this.finalTranscript.trimEnd().slice(-1)`.
- **Loading punctuation `off`** — `if (result.autoPunctuation)` skipped the string `'off'`. Replaced with `!== undefined && !== null`.
- Transient messages (copy, clear, insert) no longer reset recording / pause UI.
- Pause / resume error paths restore state correctly.
- `recognitionError` from the background clears `isRecording` and `isPaused` before updating UI.
- Ignore repeated key events (`e.repeat`).
- Initial status text matches between HTML and JS (“ready to record” in the default locale).
- Status card starts with class `status-idle`.
- **`background.js` / `updateSettings`**: only provided fields are written — both `autoPunctuation` and `language` (partial update, no accidental language wipe).
- **`content.js`**: **high** punctuation uses the same language patterns as the panel (`globalThis.AppI18n.getPack(this.currentLanguage)`), not only raw `?` / `!` in STT output.

### Changed

- Buttons split into **recording** (Start, Pause, Stop) and **text** (Insert, Copy, Clear).
- Buttons show icon + label vertically; labels no longer hide in a narrow panel.
- Version in `manifest.json`, `sidepanel.html`, and docs set to **3.4**.
- `closeSidePanel()` stops recording and saves the draft before closing.
- `<title>` in `sidepanel.html`: **Voice to Text Pro** style (unified branding without “side panel” in the product name).
- **`manifest.json`** content script order **`["i18n.js", "content.js"]`**; side panel loads **`i18n.js`** then **`sidepanel.js`**.

---

## 3.3 — 2026-05-06

### Fixed (v3.3)

- `manifest.json`: version bump; side panel via **`side_panel`** and **`chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })`** (open on extension icon click).

- `background.js`: `sendResponse` handling, messages, commands for side panel / content script, context menu, notifications, panel close via active tab.

- `content.js`: paste logic, conditions, last-editable tracking, paste into `input`, `textarea`, `contenteditable`.

- `content.js`: message handlers `startRecording`, `stopRecording`, `pasteSelection`, `updateSettings`.

- `sidepanel.js`: `insertBtn` handler.

- `sidepanel.js`: `none` normalized to `off` for punctuation mode.

- `sidepanel.js`: `chrome.runtime.connect()` replaced with `chrome.runtime.sendMessage()`.

- `sidepanel.js`: clear `saveTimeout` when closing the panel.

- `sidepanel.js`: text formatting / AI punctuation logic.

- `sidepanel.html`: UI and recording animation; removed dependency on missing `editorPlaceholder`.

- `styles.css`: `.hidden`, button styles, `prefers-reduced-motion`.

- `README.md`: requirements, limits, quick test, fix list.

### Improved (v3.3)

- Icons resized to 16×16, 48×48, 128×128.

- Softer handling of microphone, network, and missing content script errors.

- More reliable text draft persistence.

---

## 3.2 and earlier

- **3.2** — side panel, shortcuts, context menu (summary only; see repo history if available).
- **3.1** — first public branch with basic recognition.
