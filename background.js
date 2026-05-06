// ===========================================
// background.js: Фоновый Service Worker
// Управление состоянием расширения, командами и боковой панелью.
// ===========================================

// --- 1. Инициализация и установки ---

chrome.runtime.onInstalled.addListener(() => {
    console.log('Голос в Текст Pro установлен. Настройка контекстного меню и поведения панели.');
    
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch(error => console.error('Ошибка установки поведения боковой панели:', error));
    
    chrome.contextMenus.create({
        id: "pasteTranscript",
        title: "Вставить текст из Голос в Текст Pro",
        contexts: ["editable"]
    });
    
    chrome.storage.local.set({ sidePanelOpen: false });
});

// --- 2. Обработка горячих клавиш ---

chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const activeTab = tabs[0];
        if (!activeTab || !activeTab.id) return;

        if (command === "start_recording") {
            chrome.runtime.sendMessage({ action: "startRecording" }).catch(() => {
                chrome.tabs.sendMessage(activeTab.id, {action: "startRecording"}).catch(() => {});
            });
        } else if (command === "stop_recording") {
            chrome.runtime.sendMessage({ action: "stopRecording" }).catch(() => {
                chrome.tabs.sendMessage(activeTab.id, {action: "stopRecording"}).catch(() => {});
            });
        } else if (command === "toggle_side_panel") {
            chrome.storage.local.get('sidePanelOpen', (result) => {
                if (result.sidePanelOpen) {
                    chrome.sidePanel.setOptions({ tabId: activeTab.id, enabled: false }).catch(() => {});
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
        chrome.storage.local.get('textDraft', (result) => {
            const textToPaste = result.textDraft || '';
            if (textToPaste) {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'pasteSelection',
                    textToPaste: textToPaste
                }).catch(error => console.error('Ошибка вставки через контекстное меню:', error));
            }
        });
    }
});

// --- 4. Обработка сообщений ---

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "closeSidePanel") {
        if (sender.tab) {
            chrome.sidePanel.setOptions({ tabId: sender.tab.id, enabled: false }).catch(() => {});
            chrome.storage.local.set({ sidePanelOpen: false });
        }
        sendResponse({ success: true });
        return true;
    }
    
    if (request.type === "recordingStarted") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon48.png",
            title: "Голос в Текст Pro",
            message: "Запись голоса начата. Говорите сейчас."
        });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "updateSettings") {
        chrome.storage.local.set({ autoPunctuation: request.autoPunctuation });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "getSettings") {
        chrome.storage.local.get(['autoPunctuation', 'language'], (result) => {
            sendResponse({ 
                autoPunctuation: result.autoPunctuation || 'medium',
                language: result.language || 'ru-RU'
            });
        });
        return true;
    }
    
    sendResponse({ success: false });
    return true;
});