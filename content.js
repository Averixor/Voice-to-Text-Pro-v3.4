// ===========================================
// content.js - content script
// Speech recognition on the tab (when used) and text paste into page fields.
// ===========================================

class ContentSpeechRecognizer {
  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.finalTranscript = "";
    this.autoPunctuationLevel = "medium";
    this.initialTextLength = 0;
    this.currentLanguage = "ru-RU";
    this.lastEditableElement = null;
    this.lastContentEditableRange = null;

    if ("webkitSpeechRecognition" in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.setupRecognitionListeners();
    } else {
      console.warn(
        "Content script: Speech Recognition API not supported. Paste is still available.",
      );
    }

    this.setupEditableTracking();
    this.setupMessageListener();
    this.loadSettings();
  }

  setupRecognitionListeners() {
    if (!this.recognition) return;

    this.recognition.onstart = () => this.handleRecognitionStart();
    this.recognition.onresult = (event) => this.handleRecognitionResult(event);
    this.recognition.onerror = (event) => this.handleRecognitionError(event);
    this.recognition.onend = () => this.handleRecognitionEnd();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "startRecording") {
        this.startRecording(request.language, request.initialText);
        sendResponse({ success: true });
      } else if (request.action === "stopRecording") {
        this.stopRecording();
        sendResponse({ success: true });
      } else if (request.action === "pasteSelection") {
        const success = this.pasteText(request.textToPaste || "");
        sendResponse({ success });
      } else if (request.action === "updateSettings") {
        if (request.autoPunctuation !== undefined) {
          this.autoPunctuationLevel = request.autoPunctuation;
        }
        if (request.language !== undefined) {
          this.currentLanguage = request.language;
        }
        sendResponse({ success: true });
      }
      return true;
    });
  }

  setupEditableTracking() {
    const rememberFromEvent = (event) => {
      const editable = this.findEditableElement(event.target);
      if (editable) {
        this.rememberEditableElement(editable);
      }
    };

    document.addEventListener("focusin", rememberFromEvent, true);
    document.addEventListener("mousedown", rememberFromEvent, true);
    document.addEventListener("mouseup", rememberFromEvent, true);
    document.addEventListener("keyup", rememberFromEvent, true);
    document.addEventListener("input", rememberFromEvent, true);
    document.addEventListener("contextmenu", rememberFromEvent, true);
    document.addEventListener(
      "selectionchange",
      () => {
        const editable = this.findEditableElement(document.activeElement);
        if (editable) {
          this.rememberEditableElement(editable);
        }
      },
      true,
    );
  }

  findEditableElement(element) {
    let current = element;
    while (
      current &&
      current !== document &&
      current !== document.documentElement
    ) {
      if (this.isEditableElement(current)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  isEditableElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;

    const tagName = element.tagName;
    if (tagName === "TEXTAREA") {
      return !element.disabled && !element.readOnly;
    }

    if (tagName === "INPUT") {
      const type = (element.type || "text").toLowerCase();
      const textInputTypes = new Set([
        "text",
        "search",
        "url",
        "tel",
        "email",
        "password",
        "number",
        "date",
        "datetime-local",
        "month",
        "time",
        "week",
      ]);
      return textInputTypes.has(type) && !element.disabled && !element.readOnly;
    }

    return (
      element.isContentEditable === true ||
      element.getAttribute("contenteditable") === "true"
    );
  }

  rememberEditableElement(element) {
    if (!this.isEditableElement(element)) return;

    this.lastEditableElement = element;

    if (
      element.isContentEditable ||
      element.getAttribute("contenteditable") === "true"
    ) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (
          element.contains(range.commonAncestorContainer) ||
          element === range.commonAncestorContainer
        ) {
          this.lastContentEditableRange = range.cloneRange();
        }
      }
    }
  }

  loadSettings() {
    chrome.storage.local.get(["autoPunctuation", "language"], (result) => {
      this.autoPunctuationLevel = result.autoPunctuation || "medium";
      this.currentLanguage = result.language || "ru-RU";
    });
  }

  startRecording(language = "ru-RU", initialText = "") {
    if (!this.recognition) {
      chrome.runtime.sendMessage({
        action: "recognitionError",
        error: "not-supported",
      });
      return;
    }

    if (this.isRecording) {
      this.stopRecording();
    }

    this.currentLanguage = language;
    this.recognition.lang = language;
    this.finalTranscript = initialText.trim();
    this.initialTextLength = this.finalTranscript.length;

    try {
      this.recognition.start();
      this.isRecording = true;
      chrome.runtime.sendMessage({
        action: "recordingStarted",
        language: language,
        type: "recordingStarted",
      });
    } catch (e) {
      console.error("Failed to start recognition:", e);
      chrome.runtime.sendMessage({
        action: "recognitionError",
        error: "start-failed",
      });
      this.isRecording = false;
    }
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
    }
  }

  handleRecognitionStart() {
    this.isRecording = true;
    console.log("Content script: recognition started.");
  }

  handleRecognitionEnd() {
    this.isRecording = false;
    console.log("Content script: recognition ended.");
    chrome.runtime.sendMessage({ action: "recordingStopped" });
  }

  handleRecognitionError(event) {
    console.error("Content script: recognition error:", event.error);
    chrome.runtime.sendMessage({
      action: "recognitionError",
      error: event.error,
    });

    if (
      this.isRecording &&
      (event.error === "no-speech" || event.error === "audio-capture")
    ) {
      this.isRecording = false;
    } else if (event.error === "not-allowed") {
      this.isRecording = false;
      this.recognition.stop();
    }
  }

  handleRecognitionResult(event) {
    let interimTranscript = "";
    let finalSegment = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      let transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalSegment += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalSegment) {
      const formattedSegment = this.applyPunctuation(finalSegment);
      this.finalTranscript += formattedSegment + " ";
    }

    chrome.runtime.sendMessage({
      action: "updateTranscript",
      final: this.finalTranscript,
      interim: interimTranscript,
    });
  }

  applyPunctuation(text) {
    if (this.autoPunctuationLevel === "off") {
      return text;
    }

    let formattedText = text.trim();
    if (!formattedText) return formattedText;

    const lastFinalChar = this.finalTranscript.trim().slice(-1);
    const isStartOfSentence =
      this.finalTranscript.trim().length === this.initialTextLength ||
      (this.finalTranscript.length > 0 &&
        [".", "?", "!", ":", ";", "…", "\n"].includes(lastFinalChar));

    if (isStartOfSentence) {
      formattedText =
        formattedText.charAt(0).toUpperCase() + formattedText.slice(1);
    }

    const lastChar = formattedText.slice(-1);
    if (![".", ",", "?", "!", ";", ":", "…"].includes(lastChar)) {
      if (this.autoPunctuationLevel === "low") {
        formattedText += ".";
      } else if (
        this.autoPunctuationLevel === "medium" &&
        formattedText.length > 8
      ) {
        formattedText += ".";
      } else if (this.autoPunctuationLevel === "high") {
        const pack = globalThis.AppI18n?.getPack?.(this.currentLanguage);
        if (pack?.punctQuestionRe?.test?.(formattedText)) {
          formattedText += "?";
        } else if (pack?.punctExclaimRe?.test?.(formattedText)) {
          formattedText += "!";
        } else if (formattedText.length > 5) {
          formattedText += ".";
        }
      }
    }

    return formattedText.trim();
  }

  getPasteTarget() {
    const activeEditable = this.findEditableElement(document.activeElement);
    if (activeEditable) {
      this.rememberEditableElement(activeEditable);
      return activeEditable;
    }

    if (
      this.lastEditableElement &&
      document.contains(this.lastEditableElement) &&
      this.isEditableElement(this.lastEditableElement)
    ) {
      return this.lastEditableElement;
    }

    return null;
  }

  pasteText(textToPaste) {
    if (!textToPaste) {
      chrome.runtime.sendMessage({ action: "pasteCompleted", success: false });
      return false;
    }

    const target = this.getPasteTarget();
    let success = false;

    if (target) {
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        target.focus();
        let start = target.value.length;
        let end = start;

        try {
          start =
            typeof target.selectionStart === "number"
              ? target.selectionStart
              : target.value.length;
          end =
            typeof target.selectionEnd === "number"
              ? target.selectionEnd
              : start;
        } catch (error) {
          start = target.value.length;
          end = start;
        }

        try {
          if (typeof target.setRangeText === "function") {
            target.setRangeText(textToPaste, start, end, "end");
          } else {
            throw new Error("setRangeText is not available");
          }
        } catch (error) {
          const originalValue = target.value || "";
          target.value =
            originalValue.substring(0, start) +
            textToPaste +
            originalValue.substring(end);
          const newCursorPos = start + textToPaste.length;
          try {
            target.selectionStart = newCursorPos;
            target.selectionEnd = newCursorPos;
          } catch (selectionError) {
            // Some input[type] elements do not allow programmatic selection.
          }
        }

        target.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: textToPaste,
          }),
        );
        target.dispatchEvent(new Event("change", { bubbles: true }));
        success = true;
      } else if (
        target.isContentEditable ||
        target.getAttribute("contenteditable") === "true"
      ) {
        target.focus();
        const selection = window.getSelection();
        let range = null;

        if (
          this.lastContentEditableRange &&
          (target.contains(
            this.lastContentEditableRange.commonAncestorContainer,
          ) ||
            target === this.lastContentEditableRange.commonAncestorContainer)
        ) {
          range = this.lastContentEditableRange.cloneRange();
        } else if (selection && selection.rangeCount > 0) {
          const currentRange = selection.getRangeAt(0);
          if (
            target.contains(currentRange.commonAncestorContainer) ||
            target === currentRange.commonAncestorContainer
          ) {
            range = currentRange;
          }
        }

        if (range) {
          selection.removeAllRanges();
          selection.addRange(range);
        }

        if (!document.execCommand("insertText", false, textToPaste)) {
          const activeRange =
            selection && selection.rangeCount > 0
              ? selection.getRangeAt(0)
              : null;
          if (activeRange) {
            activeRange.deleteContents();
            const textNode = document.createTextNode(textToPaste);
            activeRange.insertNode(textNode);
            activeRange.setStartAfter(textNode);
            activeRange.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(activeRange);
          } else {
            target.appendChild(document.createTextNode(textToPaste));
          }
        }

        target.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            inputType: "insertText",
            data: textToPaste,
          }),
        );
        success = true;
      }
    }

    chrome.runtime.sendMessage({ action: "pasteCompleted", success: success });
    return success;
  }
}

if (!globalThis.__voiceToTextProContentInstance) {
  globalThis.__voiceToTextProContentInstance = new ContentSpeechRecognizer();
}
