# Voice-to-Text Pro 3.4

**Voice-to-Text Pro** is a Chrome extension that converts speech to text using the **Web Speech API**.

The extension works in the **Chrome Side Panel** and provides multilingual speech recognition, smart punctuation, browser spell check, text insertion into web pages, clipboard actions, local draft saving, and a localized interface.

---

## Features

### Speech Recognition

- High-quality speech-to-text recognition through the Web Speech API.
- Main workflow runs in the Chrome Side Panel.
- Supports interim and final recognition results.
- Continuous recognition with automatic restart after recognition interruptions.
- Inserts recognized text into editable fields on web pages.

### Supported Languages

| Language                | Code  |
| ----------------------- | ----- |
| Russian                 | ru-RU |
| English — United States | en-US |
| Ukrainian               | uk-UA |
| Spanish                 | es-ES |
| French                  | fr-FR |
| German                  | de-DE |
| Italian                 | it-IT |
| Japanese                | ja-JP |
| Korean                  | ko-KR |
| Chinese — Simplified    | zh-CN |

### Smart Punctuation

The extension includes four punctuation modes:

| Mode   | Description                                      |
| ------ | ------------------------------------------------ |
| Off    | Automatic punctuation is disabled                |
| Low    | Minimal punctuation assistance                   |
| Medium | Balanced punctuation assistance                  |
| High   | Advanced punctuation with language-specific rules |

Smart punctuation features:

- Automatic capitalization after sentence endings.
- Detection of `.`, `?`, `!`, `:`, `;`, `…`, and line breaks.
- Language-specific question and exclamation patterns, especially in High mode.
- Shared punctuation logic for both the side panel and the content script.

### UI Localization

The selected recognition language automatically controls:

- Web Speech API recognition language.
- Side panel interface language.
- Text field `lang` attribute.
- Browser spell check language.
- Localized notifications.
- Localized context menu items.

### Text Tools

- Insert text into the currently focused field.
- Copy text to clipboard.
- Clear the current draft.
- Save the draft locally.
- Paste saved text through the context menu.

### Spell Check

The extension uses the built-in browser spell checker.

The spell check language follows the selected recognition language.

### Interface

- Modern Chrome Side Panel interface.
- Dark theme with animated background.
- Recording controls: Start, Pause, Resume, Stop.
- Text actions: Insert, Copy, Clear.
- Live word counter.
- ARIA support and accessibility features.
- Live status region.

---

## Keyboard Shortcuts

| Shortcut              | Action                         |
| --------------------- | ------------------------------ |
| `Ctrl+Shift+1`        | Start recording                |
| `Ctrl+Shift+2`        | Stop recording                 |
| `Ctrl+Shift+I`        | Insert text into focused field |
| `Ctrl+Shift+9`        | Open or close the side panel   |
| `Ctrl+C` in the field | Copy text                      |
| `Ctrl+Del`            | Clear text                     |

On macOS, Chrome may use `Command` instead of `Ctrl` where applicable.

---

## Installation

1. Download the release archive: `Voice-to-Text-Pro-v3.4.zip`.
2. Extract the archive.
3. Open Google Chrome.
4. Go to `chrome://extensions/`.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select the folder that contains `manifest.json`.

---

## Usage

1. Click the extension icon to open the side panel.
2. Select the recognition language.
3. Select the punctuation mode if needed.
4. Click **Start** or press `Ctrl+Shift+1`.
5. Speak into the microphone.
6. Use **Pause**, **Resume**, or **Stop** when needed.
7. Click **Insert** to paste the recognized text into the active page.

All settings and the current draft are saved automatically.

---

## Local Storage

The extension uses `chrome.storage.local` for settings and draft persistence.

| Key               | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `language`        | Selected BCP 47 language code                        |
| `autoPunctuation` | Punctuation level: `off`, `low`, `medium`, or `high` |
| `textDraft`       | Current text draft                                   |
| `sidePanelOpen`   | Side panel state                                     |

---

## Project Structure

Main files:

| File                             | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| `manifest.json`                  | Manifest V3 configuration                                     |
| `background.js`                  | Service worker for commands, menu, notifications, and script injection |
| `sidepanel.html`                 | Side panel markup                                             |
| `sidepanel.js`                   | Main side panel logic                                         |
| `i18n.js`                        | Localization and punctuation rules                            |
| `content.js`                     | Text insertion into web pages                                 |
| `styles.css`                     | Styles and animations                                         |
| `icons/`                         | Extension icons                                               |
| `README.md`                      | Project overview and usage guide                              |
| `CHANGELOG.md`                   | Version history                                               |
| `CHECKLIST_VOICE_TO_TEXT_PRO.md` | Release and manual testing checklist                          |

---

## Side Panel and Page Integration

The extension separates responsibilities clearly:

- **Side Panel** — speech recognition, editing, settings, and interface.
- **Content Script** — inserting text into web pages.
- **Shared storage** — data exchange through `chrome.storage.local`.

If the active tab does not already have the required content script, the service worker can inject `i18n.js` and `content.js` using `chrome.scripting`.

---

## Troubleshooting

### Microphone is not available

Check Chrome microphone permissions:

1. Click the lock icon in the address bar.
2. Open site settings.
3. Find microphone permissions.
4. Select **Allow**.
5. Reload the page or extension.

### Recognition does not start

Check the following:

- A working microphone is connected.
- Microphone access is allowed.
- Internet connection is available.
- The selected language is supported by Chrome speech recognition.
- The browser supports the Web Speech API.

### Text does not insert

Try the following:

- Click inside the target field before inserting text.
- Use a standard `input`, `textarea`, or `contenteditable` field.
- Reload the tab and try again.
- Use the context menu paste option.

Some complex rich-text editors may block programmatic insertion.

### Interface language did not change

Try the following:

- Close and reopen the side panel.
- Change the language again.
- Reload the extension on `chrome://extensions/`.

---

## Tech Stack

- Web Speech API: `SpeechRecognition` / `webkitSpeechRecognition`
- Chrome Extensions Manifest V3
- Chrome Side Panel API
- `chrome.storage.local`
- `chrome.scripting`
- JavaScript ES6+
- Standalone `i18n.js`

---

## Requirements

- Google Chrome 114+
- Chrome Side Panel support
- Microphone
- Internet connection for speech recognition

---

## Updating

1. Replace the extension files.
2. Open `chrome://extensions/`.
3. Click **Reload** on **Voice-to-Text Pro**.
4. Reopen the side panel.

---

## Release

Recommended release archive name:

`Voice-to-Text-Pro-v3.4.zip`

---

## License

MIT License

---

## Author

Averixor

---

# Voice-to-Text Pro 3.4

**Voice-to-Text Pro** — це розширення для Google Chrome, яке перетворює мовлення на текст за допомогою **Web Speech API**.

Розширення працює в **боковій панелі Chrome** та підтримує багатомовне розпізнавання мовлення, розумну пунктуацію, перевірку орфографії, вставку тексту на веб-сторінки, роботу з буфером обміну, локальне збереження чернетки та локалізований інтерфейс.

---

## Основні можливості

### Розпізнавання мовлення

- Якісне розпізнавання мовлення через Web Speech API.
- Основний робочий процес відбувається в боковій панелі Chrome.
- Підтримка проміжних і фінальних результатів розпізнавання.
- Безперервне розпізнавання з автоматичним перезапуском після переривань.
- Вставка розпізнаного тексту в редаговані поля на веб-сторінках.

### Підтримувані мови

| Мова                 | Код   |
| -------------------- | ----- |
| Російська            | ru-RU |
| Англійська — США     | en-US |
| Українська           | uk-UA |
| Іспанська            | es-ES |
| Французька           | fr-FR |
| Німецька             | de-DE |
| Італійська           | it-IT |
| Японська             | ja-JP |
| Корейська            | ko-KR |
| Китайська — спрощена | zh-CN |

### Розумна пунктуація

Розширення має чотири режими пунктуації:

| Режим  | Опис                                            |
| ------ | ----------------------------------------------- |
| Off    | Автоматична пунктуація вимкнена                 |
| Low    | Мінімальна допомога з пунктуацією               |
| Medium | Збалансована допомога з пунктуацією             |
| High   | Розширена пунктуація з мовнозалежними правилами |

Можливості розумної пунктуації:

- Автоматична капіталізація після завершення речення.
- Розпізнавання `.`, `?`, `!`, `:`, `;`, `…` та переходів на новий рядок.
- Мовнозалежні шаблони питань і окликів, особливо в режимі High.
- Єдина логіка пунктуації для бокової панелі та content script.

### Локалізація інтерфейсу

Обрана мова розпізнавання автоматично керує:

- мовою Web Speech API;
- мовою інтерфейсу бокової панелі;
- атрибутом `lang` текстового поля;
- мовою браузерної перевірки орфографії;
- локалізованими сповіщеннями;
- локалізованими пунктами контекстного меню.

### Інструменти роботи з текстом

- Вставка тексту в активне поле.
- Копіювання тексту в буфер обміну.
- Очищення поточної чернетки.
- Локальне збереження чернетки.
- Вставка збереженого тексту через контекстне меню.

### Перевірка орфографії

Розширення використовує вбудовану перевірку орфографії браузера.

Мова перевірки відповідає обраній мові розпізнавання.

### Інтерфейс

- Сучасна бокова панель Chrome.
- Темна тема з анімованим фоном.
- Кнопки керування записом: Start, Pause, Resume, Stop.
- Дії з текстом: Insert, Copy, Clear.
- Лічильник слів.
- Підтримка ARIA та доступності.
- Область живого статусу.

---

## Клавіатурні скорочення

| Комбінація             | Дія                                |
| ---------------------- | ---------------------------------- |
| `Ctrl+Shift+1`         | Почати запис                       |
| `Ctrl+Shift+2`         | Зупинити запис                     |
| `Ctrl+Shift+I`         | Вставити текст в активне поле      |
| `Ctrl+Shift+9`         | Відкрити або закрити бокову панель |
| `Ctrl+C` у полі        | Копіювати текст                    |
| `Ctrl+Del`             | Очистити текст                     |

На macOS Chrome може використовувати `Command` замість `Ctrl`.

---

## Встановлення

1. Завантажте релізний архів: `Voice-to-Text-Pro-v3.4.zip`.
2. Розпакуйте архів.
3. Відкрийте Google Chrome.
4. Перейдіть за адресою `chrome://extensions/`.
5. Увімкніть **Developer mode**.
6. Натисніть **Load unpacked**.
7. Оберіть папку, у якій знаходиться `manifest.json`.

---

## Як користуватися

1. Натисніть на іконку розширення, щоб відкрити бокову панель.
2. Оберіть мову розпізнавання.
3. За потреби оберіть режим пунктуації.
4. Натисніть **Start** або `Ctrl+Shift+1`.
5. Говоріть у мікрофон.
6. Використовуйте **Pause**, **Resume** або **Stop** за потреби.
7. Натисніть **Insert**, щоб вставити розпізнаний текст на активну сторінку.

Усі налаштування та поточна чернетка зберігаються автоматично.

---

## Локальне сховище

Розширення використовує `chrome.storage.local` для налаштувань і збереження чернетки.

| Ключ              | Опис                                                 |
| ----------------- | ---------------------------------------------------- |
| `language`        | Обраний мовний код BCP 47                            |
| `autoPunctuation` | Рівень пунктуації: `off`, `low`, `medium` або `high` |
| `textDraft`       | Поточна текстова чернетка                            |
| `sidePanelOpen`   | Стан бокової панелі                                  |

---

## Структура проєкту

Основні файли:

| Файл                             | Опис                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `manifest.json`                  | Конфігурація Manifest V3                                  |
| `background.js`                  | Service Worker для команд, меню, сповіщень та інʼєкції скриптів |
| `sidepanel.html`                 | Розмітка бокової панелі                                   |
| `sidepanel.js`                   | Основна логіка бокової панелі                             |
| `i18n.js`                        | Локалізація та правила пунктуації                         |
| `content.js`                     | Вставка тексту на веб-сторінки                            |
| `styles.css`                     | Стилі та анімації                                         |
| `icons/`                         | Іконки розширення                                         |
| `README.md`                      | Огляд проєкту та інструкція користувача                   |
| `CHANGELOG.md`                   | Історія змін                                              |
| `CHECKLIST_VOICE_TO_TEXT_PRO.md` | Чеклист релізу та ручного тестування                      |

---

## Інтеграція бокової панелі та сторінки

Розширення чітко розділяє відповідальність:

- **Side Panel** — розпізнавання мовлення, редагування, налаштування та інтерфейс.
- **Content Script** — вставка тексту на веб-сторінки.
- **Shared storage** — обмін даними через `chrome.storage.local`.

Якщо на активній вкладці ще немає потрібного content script, service worker може інʼєктувати `i18n.js` і `content.js` через `chrome.scripting`.

---

## Усунення несправностей

### Мікрофон недоступний

Перевірте дозволи Chrome:

1. Натисніть іконку замка в адресному рядку.
2. Відкрийте налаштування сайту.
3. Знайдіть дозвіл для мікрофона.
4. Оберіть **Allow**.
5. Перезавантажте сторінку або розширення.

### Розпізнавання не запускається

Перевірте:

- чи підключений робочий мікрофон;
- чи дозволений доступ до мікрофона;
- чи є підключення до інтернету;
- чи підтримується обрана мова в Chrome speech recognition;
- чи підтримує браузер Web Speech API.

### Текст не вставляється

Спробуйте:

- клікнути в потрібне поле перед вставкою;
- використовувати стандартне поле `input`, `textarea` або `contenteditable`;
- перезавантажити вкладку;
- скористатися вставкою через контекстне меню.

Деякі складні rich-text редактори можуть блокувати програмну вставку.

### Мова інтерфейсу не змінилася

Спробуйте:

- закрити та знову відкрити бокову панель;
- повторно змінити мову;
- перезавантажити розширення на `chrome://extensions/`.

---

## Технологічний стек

- Web Speech API: `SpeechRecognition` / `webkitSpeechRecognition`
- Chrome Extensions Manifest V3
- Chrome Side Panel API
- `chrome.storage.local`
- `chrome.scripting`
- JavaScript ES6+
- Standalone `i18n.js`

---

## Вимоги

- Google Chrome 114+
- Підтримка Chrome Side Panel
- Мікрофон
- Підключення до інтернету для розпізнавання мовлення

---

## Оновлення

1. Замініть файли розширення.
2. Відкрийте `chrome://extensions/`.
3. Натисніть **Reload** біля **Voice-to-Text Pro**.
4. Повторно відкрийте бокову панель.

---

## Реліз

Рекомендована назва релізного архіву:

`Voice-to-Text-Pro-v3.4.zip`

---

## Ліцензія

MIT License

---

## Автор

Averixor
