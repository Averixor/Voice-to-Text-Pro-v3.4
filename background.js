// ===========================================
// background.js: Фоновый Service Worker
// Управление состоянием расширения, командами и боковой панелью.
// ===========================================

const CONTEXT_MENU_I18N = {
  "ru-RU": "Вставить текст из Голос в Текст Pro",
  "uk-UA": "Вставити текст з Голос у Текст Pro",
  "en-US": "Insert text from Voice to Text Pro",
  "es-ES": "Insertar texto de Voz a texto Pro",
  "fr-FR": "Insérer le texte depuis Voix vers texte Pro",
  "de-DE": "Text aus Sprache zu Text Pro einfügen",
  "it-IT": "Inserisci testo da Voce a testo Pro",
  "ja-JP": "音声テキスト化 Pro からテキストを挿入",
  "ko-KR": "음성 텍스트 Pro에서 텍스트 삽입",
  "zh-CN": "从语音转文字 Pro 插入文本",
};

const RECORDING_STARTED_NOTIFY = {
  "ru-RU": {
    title: "Голос в Текст Pro",
    message: "Запись голоса начата. Говорите сейчас.",
  },
  "uk-UA": {
    title: "Голос у Текст Pro",
    message: "Запис розпочато. Говоріть.",
  },
  "en-US": {
    title: "Voice to Text Pro",
    message: "Recording started. Speak now.",
  },
  "es-ES": {
    title: "Voz a texto Pro",
    message: "Grabación iniciada. Hable ahora.",
  },
  "fr-FR": {
    title: "Voix vers texte Pro",
    message: "Enregistrement démarré. Parlez maintenant.",
  },
  "de-DE": {
    title: "Sprache zu Text Pro",
    message: "Aufnahme gestartet. Sprechen Sie jetzt.",
  },
  "it-IT": {
    title: "Voce a testo Pro",
    message: "Registrazione avviata. Parla ora.",
  },
  "ja-JP": {
    title: "音声テキスト化 Pro",
    message: "録音を開始しました。話してください。",
  },
  "ko-KR": {
    title: "음성 텍스트 Pro",
    message: "녹음이 시작되었습니다. 말하세요.",
  },
  "zh-CN": {
    title: "语音转文字 Pro",
    message: "已开始录音，请说话。",
  },
};

function notifyStringsForLanguage(code) {
  return RECORDING_STARTED_NOTIFY[code] || RECORDING_STARTED_NOTIFY["en-US"];
}

function contextMenuTitleForLanguage(code) {
  return CONTEXT_MENU_I18N[code] || CONTEXT_MENU_I18N["en-US"];
}

function createOrRefreshContextMenu(languageCode) {
  const title = contextMenuTitleForLanguage(languageCode || "ru-RU");
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "pasteTranscript",
      title,
      contexts: ["editable"],
    });
  });
}

function sendPasteToTab(tabId, textToPaste) {
  const payload = {
    action: "pasteSelection",
    textToPaste,
  };

  return chrome.tabs.sendMessage(tabId, payload).catch(() =>
    chrome.scripting
      .executeScript({
        target: { tabId },
        files: ["i18n.js", "content.js"],
      })
      .then(() => chrome.tabs.sendMessage(tabId, payload)),
  );
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.language) return;
  const lang = changes.language.newValue || "ru-RU";
  const title = contextMenuTitleForLanguage(lang);
  chrome.contextMenus.update("pasteTranscript", { title }, () => {
    if (chrome.runtime.lastError) {
      createOrRefreshContextMenu(lang);
    }
  });
});

// --- 1. Инициализация и установки ---

chrome.runtime.onInstalled.addListener(() => {
  console.log(
    "Голос в Текст Pro установлен. Настройка контекстного меню и поведения панели.",
  );

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) =>
      console.error("Ошибка установки поведения боковой панели:", error),
    );

  chrome.storage.local.get("language", (stored) => {
    createOrRefreshContextMenu(stored.language || "ru-RU");
  });

  chrome.storage.local.set({ sidePanelOpen: false });
});

// --- 2. Обработка горячих клавиш ---

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id) return;

    if (command === "start_recording") {
      chrome.runtime.sendMessage({ action: "startRecording" }).catch(() => {
        chrome.tabs
          .sendMessage(activeTab.id, { action: "startRecording" })
          .catch(() => {});
      });
    } else if (command === "stop_recording") {
      chrome.runtime.sendMessage({ action: "stopRecording" }).catch(() => {
        chrome.tabs
          .sendMessage(activeTab.id, { action: "stopRecording" })
          .catch(() => {});
      });
    } else if (command === "toggle_side_panel") {
      chrome.storage.local.get("sidePanelOpen", (result) => {
        if (result.sidePanelOpen) {
          chrome.sidePanel
            .setOptions({ tabId: activeTab.id, enabled: false })
            .catch(() => {});
          chrome.storage.local.set({ sidePanelOpen: false });
        } else {
          chrome.sidePanel.open({ tabId: activeTab.id }).catch(() => {});
          chrome.storage.local.set({ sidePanelOpen: true });
        }
      });
    }
  });
});

// --- 3. Обработка контекстного меню ---

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pasteTranscript" && tab && tab.id) {
    chrome.storage.local.get("textDraft", (result) => {
      const textToPaste = result.textDraft || "";
      if (textToPaste) {
        sendPasteToTab(tab.id, textToPaste).catch((error) =>
          console.error("Ошибка вставки через контекстное меню:", error),
        );
      }
    });
  }
});

// --- 4. Обработка сообщений ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "closeSidePanel") {
    chrome.storage.local.set({ sidePanelOpen: false });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel
          .setOptions({ tabId: tabs[0].id, enabled: false })
          .then(() => {
            chrome.sidePanel
              .setOptions({ tabId: tabs[0].id, enabled: true })
              .catch(() => {});
          })
          .catch(() => {});
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "recordingStarted") {
    chrome.storage.local.get("language", (stored) => {
      const lang = stored.language || "ru-RU";
      const n = notifyStringsForLanguage(lang);
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: n.title,
        message: n.message,
      });
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "updateSettings") {
    const settings = {};

    if (request.autoPunctuation !== undefined) {
      settings.autoPunctuation = request.autoPunctuation;
    }

    if (request.language !== undefined) {
      settings.language = request.language;
    }

    chrome.storage.local.set(settings);
    sendResponse({ success: true });
    return true;
  }

  if (request.action === "getSettings") {
    chrome.storage.local.get(["autoPunctuation", "language"], (result) => {
      sendResponse({
        autoPunctuation: result.autoPunctuation || "medium",
        language: result.language || "ru-RU",
      });
    });
    return true;
  }

  sendResponse({ success: false });
  return true;
});
