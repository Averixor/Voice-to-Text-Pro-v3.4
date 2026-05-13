// ===========================================
// background.js - service worker
// Extension state, commands, side panel, context menu, notifications, paste.
// ===========================================

const CONTEXT_MENU_I18N = {
  "ru-RU": "Вставить текст из Голос в Текст Pro",
  "uk-UA": "Вставити текст з Голос у Текст Pro",
  "en-US": "Insert text from Voice to Text Pro",
  "es-ES": "Insertar texto de Voz a Texto Pro",
  "fr-FR": "Insérer le texte depuis Voix en Texte Pro",
  "de-DE": "Text aus Sprache zu Text Pro einfügen",
  "it-IT": "Inserisci testo da Voce in Testo Pro",
  "ja-JP": "音声テキスト変換 Pro からテキストを挿入",
  "ko-KR": "음성을 텍스트로 Pro에서 텍스트 삽입",
  "zh-CN": "从语音转文本 Pro 插入文本",
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
    title: "Voz a Texto Pro",
    message: "Grabación iniciada. Hable ahora.",
  },
  "fr-FR": {
    title: "Voix en Texte Pro",
    message: "Enregistrement démarré. Parlez maintenant.",
  },
  "de-DE": {
    title: "Sprache zu Text Pro",
    message: "Aufnahme gestartet. Sprechen Sie jetzt.",
  },
  "it-IT": {
    title: "Voce in Testo Pro",
    message: "Registrazione avviata. Parla ora.",
  },
  "ja-JP": {
    title: "音声テキスト変換 Pro",
    message: "録音を開始しました。話してください。",
  },
  "ko-KR": {
    title: "음성을 텍스트로 Pro",
    message: "녹음이 시작되었습니다. 말하세요.",
  },
  "zh-CN": {
    title: "语音转文本 Pro",
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

// --- 1. Install & startup ---

chrome.runtime.onInstalled.addListener(() => {
  console.log(
    "Voice to Text Pro installed. Configuring context menu and side panel behavior.",
  );

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) =>
      console.error("Failed to set side panel behavior:", error),
    );

  chrome.storage.local.get("language", (stored) => {
    createOrRefreshContextMenu(stored.language || "ru-RU");
  });

  chrome.storage.local.set({ sidePanelOpen: false });
});

// --- 2. Keyboard commands ---

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

// --- 3. Context menu ---

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "pasteTranscript" && tab && tab.id) {
    chrome.storage.local.get("textDraft", (result) => {
      const textToPaste = result.textDraft || "";
      if (textToPaste) {
        sendPasteToTab(tab.id, textToPaste).catch((error) =>
          console.error("Context menu paste failed:", error),
        );
      }
    });
  }
});

// --- 4. Runtime messages ---

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
