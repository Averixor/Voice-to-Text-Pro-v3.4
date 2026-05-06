// ===========================================
// content.js: Скрипт контента
// Выполняет распознавание речи и вставку текста в контексте веб-страницы.
// ===========================================

class ContentSpeechRecognizer {
    constructor() {
        if (!('webkitSpeechRecognition' in window)) {
            console.error('Content Script: API распознавания речи не поддерживается.');
            return;
        }

        this.recognition = new webkitSpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.isRecording = false;
        this.finalTranscript = '';
        this.autoPunctuationLevel = 'medium';
        this.initialTextLength = 0;
        this.currentLanguage = 'ru-RU';
        
        this.setupRecognitionListeners();
        this.setupMessageListener();
        this.loadSettings();
    }

    setupRecognitionListeners() {
        this.recognition.onstart = () => this.handleRecognitionStart();
        this.recognition.onresult = (event) => this.handleRecognitionResult(event);
        this.recognition.onerror = (event) => this.handleRecognitionError(event);
        this.recognition.onend = () => this.handleRecognitionEnd();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'startRecording') {
                this.startRecording(request.language, request.initialText);
                sendResponse({ success: true });
            } else if (request.action === 'stopRecording') {
                this.stopRecording();
                sendResponse({ success: true });
            } else if (request.action === 'pasteSelection') {
                this.pasteText(request.textToPaste);
                sendResponse({ success: true });
            } else if (request.action === 'updateSettings') {
                this.autoPunctuationLevel = request.autoPunctuation;
                this.currentLanguage = request.language || this.currentLanguage;
                sendResponse({ success: true });
            }
            return true;
        });
    }

    loadSettings() {
        chrome.storage.local.get(['autoPunctuation', 'language'], (result) => {
            this.autoPunctuationLevel = result.autoPunctuation || 'medium';
            this.currentLanguage = result.language || 'ru-RU';
        });
    }

    startRecording(language = 'ru-RU', initialText = '') {
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
            chrome.runtime.sendMessage({ action: 'recordingStarted', language: language, type: 'recordingStarted' });
        } catch (e) {
            console.error('Ошибка запуска распознавания:', e);
            chrome.runtime.sendMessage({ action: 'recognitionError', error: 'start-failed' });
            this.isRecording = false;
        }
    }

    stopRecording() {
        if (this.isRecording) {
            this.isRecording = false;
            this.recognition.stop();
        }
    }

    handleRecognitionStart() {
        this.isRecording = true;
        console.log('Content Script: Распознавание начато.');
    }

    handleRecognitionEnd() {
        this.isRecording = false;
        console.log('Content Script: Распознавание завершено.');
        chrome.runtime.sendMessage({ action: 'recordingStopped' });
    }

    handleRecognitionError(event) {
        console.error('Content Script: Ошибка распознавания:', event.error);
        chrome.runtime.sendMessage({ action: 'recognitionError', error: event.error });
        
        if (this.isRecording && (event.error === 'no-speech' || event.error === 'audio-capture')) {
            this.isRecording = false;
        } else if (event.error === 'not-allowed') {
            this.isRecording = false;
            this.recognition.stop();
        }
    }

    handleRecognitionResult(event) {
        let interimTranscript = '';
        let finalSegment = '';

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
            this.finalTranscript += formattedSegment + ' ';
        }
        
        chrome.runtime.sendMessage({
            action: 'updateTranscript',
            final: this.finalTranscript,
            interim: interimTranscript
        });
    }

    applyPunctuation(text) {
        if (this.autoPunctuationLevel === 'off') {
            return text;
        }

        let formattedText = text.trim();
        
        const lastFinalChar = this.finalTranscript.trim().slice(-1);
        const isStartOfSentence = this.finalTranscript.trim().length === this.initialTextLength || 
            (this.finalTranscript.length > 0 && ['.', '?', '!', ':', ';'].includes(lastFinalChar));
        
        if (isStartOfSentence && formattedText.length > 0) {
            formattedText = formattedText.charAt(0).toUpperCase() + formattedText.slice(1);
        }
        
        const lastChar = formattedText.slice(-1);
        if (this.autoPunctuationLevel !== 'off' && !['.', ',', '?', '!', ';', ':'].includes(lastChar)) {
            if (this.autoPunctuationLevel === 'low') {
                formattedText += '.';
            } else if (this.autoPunctuationLevel === 'medium' && formattedText.length > 8) {
                formattedText += '.';
            } else if (this.autoPunctuationLevel === 'high') {
                if (formattedText.match(/\?(?:\s|$)/)) {
                    formattedText = formattedText.replace(/\?$/, '?');
                } else if (formattedText.match(/!(?:\s|$)/)) {
                    formattedText = formattedText.replace(/!$/, '!');
                } else if (formattedText.length > 5) {
                    formattedText += '.';
                }
            }
        }
        
        return formattedText.trim();
    }

    pasteText(textToPaste) {
        const activeElement = document.activeElement;
        let success = false;
        
        if (activeElement) {
            if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') {
                const start = activeElement.selectionStart || 0;
                const end = activeElement.selectionEnd || 0;
                const originalValue = activeElement.value;
                
                activeElement.value = originalValue.substring(0, start) + textToPaste + originalValue.substring(end);
                const newCursorPos = start + textToPaste.length;
                activeElement.selectionStart = newCursorPos;
                activeElement.selectionEnd = newCursorPos;
                
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                success = true;
                
            } else if (activeElement.contentEditable === 'true') {
                activeElement.focus();
                
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    const textNode = document.createTextNode(textToPaste);
                    range.insertNode(textNode);
                    range.setStartAfter(textNode);
                    range.setEndAfter(textNode);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else {
                    document.execCommand('insertText', false, textToPaste);
                }
                
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                success = true;
            } else if (activeElement.isContentEditable) {
                activeElement.focus();
                document.execCommand('insertText', false, textToPaste);
                activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                success = true;
            }
        }
        
        chrome.runtime.sendMessage({ action: 'pasteCompleted', success: success });
    }
}

new ContentSpeechRecognizer();