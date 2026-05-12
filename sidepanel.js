class SpeechToTextPro {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.isPaused = false;
    this.finalTranscript = "";
    this.microphoneAccessGranted = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.spellCheckEnabled = false;
    this.autoPunctuationLevel = "medium";
    this.sessionWordCount = 0;
    this.currentLanguage = "ru-RU";
    this.saveTimeout = null;
    this._transientStatusTimer = null;

    this.initializeElements();
    this.setupEventListeners();
    this.loadSavedSettings();
    this.checkBrowserSupport();
    this.setupSpellCheck();
    this.updateStats();
    this.updateEditorOverlay();
  }

  initializeElements() {
    this.startBtn = document.getElementById("startBtn");
    this.pauseBtn = document.getElementById("pauseBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.insertBtn = document.getElementById("insertBtn");
    this.copyBtn = document.getElementById("copyBtn");
    this.clearBtn = document.getElementById("clearBtn");
    this.closeBtn = document.getElementById("closeBtn");
    this.output = document.getElementById("output");
    this.status = document.getElementById("status");
    this.statusCard = document.getElementById("statusCard");
    this.recordingTime = document.getElementById("recordingTime");
    this.timeCount = document.getElementById("timeCount");
    this.languageSelect = document.getElementById("language");
    this.autoPunctuationSelect = document.getElementById("autoPunctuation");
    this.instructions = document.getElementById("instructions");
    this.sessionStats = document.getElementById("sessionStats");
    this.editorOverlay = document.getElementById("editorOverlay");
    this.waveContainer = document.getElementById("waveContainer");

    this.output.setAttribute("autocomplete", "off");
    this.output.setAttribute("spellcheck", "true");
  }

  setupEventListeners() {
    this.startBtn.addEventListener("click", () => this.startRecording());
    this.pauseBtn.addEventListener("click", () => this.pauseRecording());
    this.stopBtn.addEventListener("click", () => this.stopRecording());
    this.insertBtn.addEventListener("click", () =>
      this.insertTextToActiveField(),
    );
    this.copyBtn.addEventListener("click", () => this.copyToClipboard());
    this.clearBtn.addEventListener("click", () => this.clearText());
    this.closeBtn.addEventListener("click", () => this.closeSidePanel());

    this.languageSelect.addEventListener("change", () => this.saveSettings());
    this.autoPunctuationSelect.addEventListener("change", (e) => {
      this.autoPunctuationLevel = e.target.value;
      this.saveSettings();
      this.updateContentScriptSettings();
    });

    this.output.addEventListener("input", () => {
      this.updateStats();
      this.updateEditorOverlay();
      this.saveTextDraft();
    });

    document.addEventListener("keydown", (e) =>
      this.handleGlobalKeyboardShortcuts(e),
    );

    this.output.addEventListener("paste", () => {
      setTimeout(() => {
        this.updateStats();
        this.updateEditorOverlay();
        this.saveTextDraft();
      }, 50);
    });
  }

  static getSpeechRecognitionCtor() {
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  }

  checkBrowserSupport() {
    if (!SpeechToTextPro.getSpeechRecognitionCtor()) {
      this.status.textContent =
        "Ошибка: Ваш браузер не поддерживает Speech Recognition API.";
      this.statusCard.classList.remove("status-info");
      this.statusCard.classList.add("status-error");
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = true;
      this.stopBtn.disabled = true;
    } else {
      this.initRecognition();
    }
  }

  initRecognition() {
    const Recognition = SpeechToTextPro.getSpeechRecognitionCtor();
    if (!Recognition) return;
    this.recognition = new Recognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.languageSelect.value;

    this.setupRecognitionHandlers();
  }

  setupRecognitionHandlers() {
    this.recognition.onstart = () => {
      this.isRecording = true;
      this.updateUIStatus("recording");
      this.startTimer();
      this.sendRecordingNotification();
    };

    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event);
      this.stopTimer();

      if (
        event.error === "not-allowed" ||
        event.error === "permission-denied"
      ) {
        this.microphoneAccessGranted = false;
        this.instructions.style.display = "flex";
        this.status.textContent =
          "Нет доступа к микрофону. Разрешите доступ и обновите страницу.";
        this.isRecording = false;
        this.isPaused = false;
        this.updateUIStatus("error", "Нет доступа к микрофону");
      } else if (event.error === "no-speech") {
        if (this.isRecording) {
          this.recognition.start();
        }
      } else if (event.error === "network") {
        this.status.textContent = "Ошибка сети. Проверьте подключение.";
        this.isRecording = false;
        this.isPaused = false;
        this.updateUIStatus("error", "Ошибка сети");
      } else {
        this.isRecording = false;
        this.isPaused = false;
        this.updateUIStatus("error", "Ошибка распознавания");
      }
    };

    this.recognition.onend = () => {
      if (this.isRecording) {
        console.log("Recognition ended automatically. Restarting...");
        try {
          this.recognition.start();
        } catch (e) {
          console.error("Failed to restart recognition:", e);
          this.isRecording = false;
          this.isPaused = false;
          this.updateUIStatus("idle", "Запись остановлена");
        }
      } else if (!this.isPaused) {
        this.updateUIStatus("idle", "Запись остановлена");
      }
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.finalTranscript += this.formatText(transcript);
        } else {
          interimTranscript += transcript;
        }
      }
      this.output.value = this.finalTranscript + interimTranscript;
      this.output.scrollTop = this.output.scrollHeight;
      this.updateStats();
      this.updateEditorOverlay();
    };
  }

  startRecording() {
    if (this.isPaused) {
      this.resumeRecording();
      return;
    }

    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) return;

    this.recognition.lang = this.languageSelect.value;
    this.currentLanguage = this.languageSelect.value;
    this.finalTranscript = this.output.value;
    this.isPaused = false;
    this.isRecording = true;

    try {
      this.recognition.start();
      this.updateUIStatus("preparing", "Ожидание микрофона...");
      this.instructions.style.display = "none";
      this.saveSettings();
    } catch (e) {
      console.error("Failed to start recognition:", e);
      this.isRecording = false;
      this.isPaused = false;
      this.updateUIStatus("error", "Не удалось запустить запись");
    }
  }

  pauseRecording() {
    if (!this.recognition || !this.isRecording || this.isPaused) return;

    this.isPaused = true;
    this.isRecording = false;

    try {
      this.recognition.stop();
    } catch (e) {
      console.error("Failed to pause recognition:", e);
      this.isPaused = false;
      this.isRecording = true;
      this.updateUIStatus("recording");
      return;
    }

    this.stopTimer();
    this.saveTextDraft();
    this.updateUIStatus("paused", "На паузе");
  }

  resumeRecording() {
    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition || !this.isPaused) return;

    this.isPaused = false;
    this.recognition.lang = this.languageSelect.value;
    this.currentLanguage = this.languageSelect.value;
    this.finalTranscript = this.output.value;
    this.isRecording = true;

    try {
      this.recognition.start();
      this.updateUIStatus("preparing", "Ожидание микрофона...");
      this.saveSettings();
    } catch (e) {
      console.error("Failed to resume recognition:", e);
      this.isPaused = true;
      this.isRecording = false;
      this.updateUIStatus("paused", "На паузе");
    }
  }

  stopRecording() {
    if (!this.recognition) return;

    this.isPaused = false;
    const wasLive = this.isRecording;
    this.isRecording = false;

    if (wasLive) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.error("Failed to stop recognition:", e);
      }
    }

    this.stopTimer();
    this.saveTextDraft();
    this.updateUIStatus("idle", "Запись остановлена");
  }

  insertTextToActiveField() {
    const textToInsert = this.output.value;
    if (!textToInsert.trim()) {
      this.showTransientStatus("Нет текста для вставки");
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (!activeTab?.id) {
        this.showTransientStatus("Нет активной вкладки");
        return;
      }
      chrome.tabs
        .sendMessage(activeTab.id, {
          action: "pasteSelection",
          textToPaste: textToInsert,
        })
        .catch(() => {
          this.showTransientStatus("Не удалось вставить текст", 2500, true);
        });
      this.showTransientStatus("Текст вставлен");
    });
  }

  startTimer() {
    this.recordingStartTime = Date.now();
    this.timeCount.textContent = "00:00";
    clearInterval(this.recordingTimer);
    this.recordingTimer = setInterval(() => {
      const elapsed = Date.now() - this.recordingStartTime;
      const totalSeconds = Math.floor(elapsed / 1000);
      const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      this.timeCount.textContent = `${minutes}:${seconds}`;
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.recordingTimer);
  }

  formatText(text) {
    if (this.autoPunctuationLevel === "off") {
      return text + " ";
    }

    let formatted = text.trim();

    const committedBefore = this.finalTranscript.trimEnd();
    const lastChar = committedBefore.slice(-1);
    const sentenceEndChars = [".", "?", "!", ":", ";", "\n", "…"];
    const isStartOfSentence =
      committedBefore.length === 0 || sentenceEndChars.includes(lastChar);

    if (isStartOfSentence && formatted.length > 0) {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    if (!formatted.match(/[.?!,;:]$/)) {
      if (this.autoPunctuationLevel === "low") {
        formatted += ".";
      } else if (
        this.autoPunctuationLevel === "medium" &&
        formatted.length > 8
      ) {
        formatted += ".";
      } else if (this.autoPunctuationLevel === "high") {
        if (
          formatted
            .toLowerCase()
            .match(
              /\b(почему|зачем|как|кто|что|где|когда|сколько|чей|какой|который)\b/,
            )
        ) {
          formatted += "?";
        } else if (
          formatted.toLowerCase().match(/\b(как|что за|ну и|ура|ой|ах|ого)\b/)
        ) {
          formatted += "!";
        } else if (formatted.length > 5) {
          formatted += ".";
        }
      }
    }

    return formatted + " ";
  }

  /**
   * Показ сообщения в строке статуса без сброса режима записи / паузы.
   * @param {boolean} [asError] — если true, временно подсветить карточку как ошибку (idle/error UI).
   */
  showTransientStatus(message, durationMs = 2000, asError = false) {
    clearTimeout(this._transientStatusTimer);

    const restore = () => {
      if (this.isRecording) this.updateUIStatus("recording");
      else if (this.isPaused) this.updateUIStatus("paused", "На паузе");
      else this.updateUIStatus("idle", "Готов к записи");
    };

    if (asError && !this.isRecording && !this.isPaused) {
      this.updateUIStatus("error", message);
      this._transientStatusTimer = setTimeout(() => restore(), durationMs);
      return;
    }

    if (this.isRecording || this.isPaused) {
      this.status.textContent = message;
    } else if (asError) {
      this.updateUIStatus("error", message);
    } else {
      this.updateUIStatus("idle", message);
    }

    this._transientStatusTimer = setTimeout(() => restore(), durationMs);
  }

  updateUIStatus(state, message = "") {
    this.statusCard.classList.remove(
      "status-recording",
      "status-idle",
      "status-error",
      "status-preparing",
    );
    this.recordingTime.style.display = "none";
    if (this.waveContainer) this.waveContainer.style.display = "none";

    const startLabel = this.startBtn.querySelector("span");

    if (state === "recording") {
      this.statusCard.classList.add("status-recording");
      this.status.textContent = message || "Идет запись...";
      this.recordingTime.style.display = "flex";
      if (this.waveContainer) this.waveContainer.style.display = "flex";
      if (startLabel) startLabel.textContent = "Начать";
      this.startBtn.classList.add("hidden");
      this.pauseBtn.classList.remove("hidden");
      this.stopBtn.classList.remove("hidden");
    } else if (state === "paused") {
      this.statusCard.classList.add("status-idle");
      this.status.textContent = message || "На паузе";
      this.recordingTime.style.display = "flex";
      if (startLabel) startLabel.textContent = "Продолжить";
      this.startBtn.classList.remove("hidden");
      this.pauseBtn.classList.add("hidden");
      this.stopBtn.classList.remove("hidden");
    } else if (state === "idle") {
      this.statusCard.classList.add("status-idle");
      this.status.textContent = message || "Готов к записи";
      if (startLabel) startLabel.textContent = "Начать";
      this.startBtn.classList.remove("hidden");
      this.pauseBtn.classList.add("hidden");
      this.stopBtn.classList.add("hidden");
    } else if (state === "error") {
      this.statusCard.classList.add("status-error");
      this.status.textContent = message || "Произошла ошибка";
      if (startLabel) startLabel.textContent = "Начать";
      this.startBtn.classList.remove("hidden");
      this.pauseBtn.classList.add("hidden");
      this.stopBtn.classList.add("hidden");
    } else if (state === "preparing") {
      this.statusCard.classList.add("status-preparing");
      this.status.textContent = message || "Подготовка...";
      if (startLabel) startLabel.textContent = "Начать";
      this.startBtn.classList.add("hidden");
      this.pauseBtn.classList.remove("hidden");
      this.stopBtn.classList.remove("hidden");
    }
  }

  copyToClipboard() {
    this.output.select();
    document.execCommand("copy");
    this.showTransientStatus("Текст скопирован в буфер обмена");
  }

  clearText() {
    this.output.value = "";
    this.finalTranscript = "";
    this.sessionWordCount = 0;
    this.updateStats();
    this.updateEditorOverlay();
    chrome.storage.local.set({ textDraft: "" });
    this.showTransientStatus("Текст очищен");
  }

  closeSidePanel() {
    if (this.isRecording) {
      this.stopRecording();
    }
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    clearTimeout(this._transientStatusTimer);
    this.saveTextDraft();
    chrome.runtime.sendMessage({ action: "closeSidePanel" }).catch(() => {});
    window.close();
  }

  updateStats() {
    const text = this.output.value.trim();
    const wordCount = text
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    this.sessionWordCount = wordCount;
    this.sessionStats.innerHTML = `<span>Сессия: ${wordCount} ${this.getWordDeclension(wordCount)}</span>`;
  }

  getWordDeclension(count) {
    if (count % 10 === 1 && count % 100 !== 11) return "слово";
    if (
      count % 10 >= 2 &&
      count % 10 <= 4 &&
      (count % 100 < 10 || count % 100 >= 20)
    )
      return "слова";
    return "слов";
  }

  updateEditorOverlay() {
    if (this.output.value.length > 0) {
      this.editorOverlay.style.opacity = "0";
      this.editorOverlay.style.pointerEvents = "none";
    } else {
      this.editorOverlay.style.opacity = "1";
      this.editorOverlay.style.pointerEvents = "auto";
    }
  }

  setupSpellCheck() {
    this.output.setAttribute("spellcheck", "true");
    this.output.setAttribute("lang", this.languageSelect.value.split("-")[0]);
  }

  sendRecordingNotification() {
    chrome.runtime.sendMessage({ type: "recordingStarted" }).catch(() => {});
  }

  updateContentScriptSettings() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs
          .sendMessage(tabs[0].id, {
            action: "updateSettings",
            autoPunctuation: this.autoPunctuationLevel,
            language: this.languageSelect.value,
          })
          .catch(() => {});
      }
    });
  }

  handleGlobalKeyboardShortcuts(e) {
    if (e.repeat) return;

    if (
      e.ctrlKey &&
      e.code === "KeyC" &&
      document.activeElement === this.output
    ) {
      this.copyToClipboard();
      e.preventDefault();
    }

    if (e.ctrlKey && e.code === "Delete") {
      this.clearText();
      e.preventDefault();
    }

    if (e.ctrlKey && e.shiftKey && e.code === "Digit1") {
      this.startRecording();
      e.preventDefault();
    }

    if (e.ctrlKey && e.shiftKey && e.code === "Digit2") {
      this.stopRecording();
      e.preventDefault();
    }

    if (e.ctrlKey && e.shiftKey && e.code === "KeyI") {
      this.insertTextToActiveField();
      e.preventDefault();
    }
  }

  saveSettings() {
    const settings = {
      language: this.languageSelect.value,
      autoPunctuation: this.autoPunctuationSelect.value,
      textDraft: this.output.value,
    };
    chrome.storage.local.set(settings);
    this.updateContentScriptSettings();
  }

  saveTextDraft() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      chrome.storage.local.set({ textDraft: this.output.value });
    }, 1000);
  }

  loadSavedSettings() {
    chrome.storage.local.get(
      ["language", "autoPunctuation", "textDraft"],
      (result) => {
        if (result.language) {
          this.languageSelect.value = result.language;
          this.currentLanguage = result.language;
        }
        if (
          result.autoPunctuation !== undefined &&
          result.autoPunctuation !== null
        ) {
          this.autoPunctuationSelect.value = result.autoPunctuation;
          this.autoPunctuationLevel = result.autoPunctuation;
        }
        if (result.textDraft) {
          this.output.value = result.textDraft;
          this.finalTranscript = result.textDraft;
          this.updateStats();
          this.updateEditorOverlay();
        }

        if (this.recognition) {
          this.recognition.lang = this.languageSelect.value;
        }

        this.setupSpellCheck();
      },
    );
  }
}

let sttAppInstance = null;

document.addEventListener("DOMContentLoaded", () => {
  sttAppInstance = new SpeechToTextPro();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!sttAppInstance) {
    sendResponse({ success: false, error: "Not initialized" });
    return true;
  }

  if (request.action === "startRecording") {
    sttAppInstance.startRecording();
    sendResponse({ success: true });
  } else if (request.action === "stopRecording") {
    sttAppInstance.stopRecording();
    sendResponse({ success: true });
  } else if (request.action === "updateTranscript") {
    if (sttAppInstance.output) {
      sttAppInstance.output.value = request.final + request.interim;
      sttAppInstance.output.scrollTop = sttAppInstance.output.scrollHeight;
      sttAppInstance.updateStats();
      sttAppInstance.updateEditorOverlay();
    }
    sendResponse({ success: true });
  } else if (request.action === "recognitionError") {
    sttAppInstance.isRecording = false;
    sttAppInstance.isPaused = false;
    sttAppInstance.updateUIStatus("error", `Ошибка: ${request.error}`);
    sendResponse({ success: true });
  } else if (request.action === "pasteCompleted") {
    if (request.success) {
      sttAppInstance.showTransientStatus("Текст успешно вставлен");
    } else {
      sttAppInstance.showTransientStatus(
        "Не удалось вставить текст",
        2500,
        true,
      );
    }
    sendResponse({ success: true });
  }

  return true;
});
