document.addEventListener('DOMContentLoaded', () => {
  // Defer the entire setup to ensure DOM is fully ready
  setTimeout(() => {
    // Elements
const recordBtn = document.getElementById('recordButton');
const tabRecordBtn = document.getElementById('tabRecordButton');
const desktopRecordBtn = document.getElementById('desktopRecordButton');
    const statusEl = document.getElementById('status');
    const resultEl = document.getElementById('result');
    const settingsBtn = document.getElementById('settingsButton');
    const helpBtn = document.getElementById('helpButton');
    const historyBtn = document.getElementById('historyButton'); // Added history button reference
    const settingsModal = document.getElementById('settingsModal');
    const helpModal = document.getElementById('helpModal');
    const historyContainerEl = document.getElementById('historyContainer'); // Added history container reference
    const settingsForm = document.getElementById('settingsForm');
    // const toastEl = document.getElementById('toast'); // Removed toast reference
    const copyBtn = document.getElementById('copyButton');
    const editBtn = document.getElementById('editButton');
    const historyListEl = document.getElementById('historyList');

// --- Ensure modals closed on startup ---
settingsModal.classList.remove('open');
helpModal.classList.remove('open');

// --- Always close modals when side-panel/tab becomes visible ---
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    settingsModal.classList.remove('open');
    helpModal.classList.remove('open');
  }
});

    // --- Initial Element Checks ---
    if (!recordBtn || !statusEl || !resultEl || !settingsBtn || !helpBtn || !historyBtn || !settingsModal || !helpModal || !historyContainerEl || !settingsForm || !copyBtn || !editBtn || !historyListEl) {
      console.error("Popup Init Error: One or more essential elements not found!");
      // Optionally display an error message in the body if possible
      if (document.body) {
          document.body.innerHTML = '<p style="color: red; padding: 10px;">Error: Popup UI elements failed to load. Please try reloading the extension.</p>';
      }
      return; // Stop script execution if critical elements are missing
    }

    // Form Elements
    const apiKeyInput = document.getElementById('apiKey');
    const languageSelect = document.getElementById('language');
    const autoInsertCheck = document.getElementById('autoInsert');
    const autoCopyCheck = document.getElementById('autoCopy'); // Added autoCopy checkbox reference
    // pinSidePanel option removed

    // Close buttons
    const closeButtons = document.querySelectorAll('[data-close-settings], [data-close-help]');

    // Recording state
    let isRecording = false;
    let mediaRecorder = null;
    let audioChunks = [];
    let settings = {
      apiKey: '',
      language: 'auto', // Default to Automatic
      autoInsert: true,
      autoCopy: false,
      // pinSidePanel removed
    };
    let transcriptionHistory = []; // Added history array

    // --- i18n Translations ---
    const translations = {
      en: {
        popupTitle: "Voice Input",
        historyButton: "History",
        helpTitle: "Help",
        settingsTitle: "Settings",
        recordingOptions: "Recording Options",
        microphoneTitle: "Microphone",
        microphoneSubtitle: "Record from microphone",
        tabAudioTitle: "Tab Audio",
        tabAudioSubtitle: "Record audio from current tab",
        desktopAudioTitle: "Desktop Audio",
        desktopAudioSubtitle: "Record audio from desktop",
        recordButtonStart: "Start Recording",
        recordButtonStop: "Stop Recording",
        statusInitial: "Click to start recording",
        statusRecording: "Recording... Click to stop",
        statusProcessing: "Processing...",
        statusTranscribing: "Transcribing...",
        statusDone: "Done",
        statusError: "Error",
        statusPermissionDenied: "Microphone access denied",
        statusNoMicrophone: "No microphone found",
        statusMicError: "Microphone error",
        resultPlaceholder: "Your transcribed text will appear here",
        copyButtonTitle: "Copy Text",
        editButtonTitle: "Edit Text",
        transcriptionResultTitle: "Transcription Result",
        settingsModalTitle: "Settings",
        apiKeyLabel: "ELEVEN LABS API Key",
        languageLabel: "Language",
        autoInsertLabel: "Automatically insert text",
        autoCopyLabel: "Automatically copy text to clipboard",
        pinSidePanelLabel: "Pin side panel (keep open)",
        saveSettingsButton: "Save Settings",
        helpModalTitle: "Help",
        helpGettingStarted: "Getting Started:",
        helpKeyboardShortcut: "Keyboard Shortcut:",
        helpTips: "Tips:",
        historyTitle: "History (Last 5)",
        historyEmpty: "No history yet.",
        copiedToClipboard: "Copied!",
        copyFailed: "Copy failed",
        historyItemCopied: "Copied!",
      },
      he: {
        popupTitle: "קלט קולי",
        historyButton: "היסטוריה",
        helpTitle: "עזרה",
        settingsTitle: "הגדרות",
        recordingOptions: "אפשרויות הקלטה",
        microphoneTitle: "מיקרופון",
        microphoneSubtitle: "התחל הקלטה מהמיקרופון",
        tabAudioTitle: "אודיו כרטיסייה",
        tabAudioSubtitle: "הקלטת אודיו מהכרטיסייה הנוכחית",
        desktopAudioTitle: "שולחן עבודה",
        desktopAudioSubtitle: "הקלטה משולחן העבודה",
        recordButtonStart: "מיקרופון",
        recordButtonStop: "עצור הקלטה",
        statusInitial: "לחץ להתחלת הקלטה",
        statusRecording: "מקליט\u200E... לחץ לעצירה",
        statusProcessing: "מעבד\u200E...",
        statusTranscribing: "מתמלל\u200E...",
        statusDone: "בוצע",
        statusError: "שגיאה",
        statusPermissionDenied: "הגישה למיקרופון נדחתה",
        statusNoMicrophone: "לא נמצא מיקרופון",
        statusMicError: "שגיאת מיקרופון",
        resultPlaceholder: "הטקסט המתומלל יופיע כאן",
        copyButtonTitle: "העתק טקסט",
        editButtonTitle: "ערוך טקסט",
        transcriptionResultTitle: "תוצאת התמלול",
        settingsModalTitle: "הגדרות",
        apiKeyLabel: "מפתח API של ELEVEN LABS",
        languageLabel: "שפה",
        autoInsertLabel: "הכנס טקסט אוטומטית",
        autoCopyLabel: "העתק טקסט אוטומטית ללוח",
        pinSidePanelLabel: "הצמד סרגל צד (לא נסגר)",
        saveSettingsButton: "שמור הגדרות",
        helpModalTitle: "עזרה",
        helpGettingStarted: "תחילת עבודה:",
        helpKeyboardShortcut: "קיצור מקלדת:",
        helpTips: "טיפים:",
        historyTitle: "היסטוריה (5 אחרונים)",
        historyEmpty: "אין היסטוריה עדיין.",
        copiedToClipboard: "הועתק!",
        copyFailed: "העתקה נכשלה",
        historyItemCopied: "הועתק!",
      }
      // Add other languages here if needed
    };

    // Load settings and history
    loadSettings();
    loadHistory(); // Load history on popup open

    // Event Listeners
recordBtn.addEventListener('click', toggleRecording);
if (tabRecordBtn) tabRecordBtn.addEventListener('click', toggleTabRecording);
if (desktopRecordBtn) desktopRecordBtn.addEventListener('click', toggleDesktopRecording);
    // Defer adding the settingsForm listener slightly to ensure DOM is ready
    setTimeout(() => {
      const form = document.getElementById('settingsForm');
      if (form) {
        form.addEventListener('submit', saveSettings);
      } else {
        console.error("Could not find settingsForm even after timeout!");
      }
    }, 0);

    // Add other listeners immediately
    settingsBtn.addEventListener('click', openSettingsModal);
    helpBtn.addEventListener('click', openHelpModal);
    historyBtn.addEventListener('click', toggleHistory);
    copyBtn.addEventListener('click', copyResultText);
    editBtn.addEventListener('click', toggleEditMode);

    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        settingsModal.classList.remove('open');
        helpModal.classList.remove('open');
      });
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'triggerRecording') {
        // Ensure settings are loaded and API key is present before starting
        if (settings.apiKey) {
          toggleRecording(); // Use toggleRecording to handle checks and start
        } else {
          // If no API key, open settings instead
          openSettingsModal();
        }
        sendResponse({ success: true });
      }
      return true;
    });

    // Load saved settings
    function loadSettings() {
      chrome.storage.sync.get(['apiKey', 'language', 'autoInsert', 'autoCopy'], (result) => {
        if (result.apiKey) {
          settings.apiKey = result.apiKey;
          apiKeyInput.value = result.apiKey;
        }

        if (result.language) {
          settings.language = result.language;
        }
        // Always set the dropdown value, defaulting to 'auto' if not found in storage
        languageSelect.value = settings.language;

        if (result.autoInsert !== undefined) {
          settings.autoInsert = result.autoInsert;
          autoInsertCheck.checked = result.autoInsert;
        }

        if (result.autoCopy !== undefined) {
          settings.autoCopy = result.autoCopy;
          autoCopyCheck.checked = result.autoCopy;
        }

        // pinSidePanel removed

        if (!settings.apiKey) {
          openSettingsModal();
        }

        applyRtlStyles(settings.language);
        updateUIText(settings.language);
      });
    }

    // Save settings
    function saveSettings(e) {
      e.preventDefault();

      const newSettings = {
        apiKey: apiKeyInput.value,
        language: languageSelect.value,
        autoInsert: autoInsertCheck.checked,
        autoCopy: autoCopyCheck.checked
      };

      chrome.storage.sync.set(newSettings, () => {
        settings = newSettings;
        settingsModal.classList.remove('open');

        applyRtlStyles(settings.language);
        updateUIText(settings.language);

        console.log("Settings saved:", newSettings); // Debug log
        chrome.runtime.sendMessage({ action: 'settingsSaved' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error notifying background script:", chrome.runtime.lastError);
          } else {
            console.log("Background script notified of settings save.");
          }
        });
      });
    }

    // Toggle recording
    async function toggleRecording() {
      if (isRecording) {
        stopRecording();
      } else {
        if (!settings.apiKey) {
          openSettingsModal();
          return;
        }

        // Check permission before starting
        console.log("Popup: Checking permission before starting recording...");
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
          console.log("Popup: Permission state is", permissionStatus.state);
          if (permissionStatus.state === 'granted') {
            startRecording();
          } else {
            // If not granted (prompt or denied), trigger error handler to open permission page
            console.log("Popup: Permission not granted. Triggering error handler.");
            // Create a synthetic error object that handleMicrophoneError will recognize
            const permissionError = new Error("Permission not granted");
            permissionError.name = "PermissionDeniedError"; // Use a name handleMicrophoneError checks
            handleMicrophoneError(permissionError);
          }
        } catch (queryError) {
           console.error("Popup: Error querying permission before recording:", queryError);
           // If query fails, treat as needing the permission page too.
           const permissionError = new Error("Permission query failed");
           permissionError.name = "PermissionDeniedError"; // Use a name handleMicrophoneError checks
           handleMicrophoneError(permissionError);
        }
      }
    }

    // Handle microphone errors
    function handleMicrophoneError(error) {
      console.error('Popup: Caught error in handleMicrophoneError. Error name:', error.name, 'Error message:', error.message);
      isRecording = false;
      recordBtn.classList.remove('recording');

      // Update status section for error state
      const statusSection = document.querySelector('.status-section');
      if (statusSection) {
        statusSection.classList.remove('recording', 'processing');
        statusSection.classList.add('error');
      }

      // Check if the error is due to permission denial/dismissal or query failure
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        console.log("Popup: Error identified as permission denial/dismissal/query failure. Requesting background to open permission page.");
        chrome.runtime.sendMessage({ action: 'openPermissionPage' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error sending openPermissionPage message:", chrome.runtime.lastError);
          }
          window.close(); // Close popup after requesting permission page
        });
        return; // Stop further error handling in popup for this case
      }

      // Handle other errors (e.g., no microphone found) within the popup
      let statusKey = 'statusMicError';
      if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        statusKey = 'statusNoMicrophone';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
         console.warn('Microphone might be in use elsewhere or hardware issue.');
      }

      statusEl.textContent = getTranslation(statusKey);
      statusEl.classList.add('error');
      statusEl.classList.remove('recording', 'processing');

      const recordButtonTitle = recordBtn.querySelector('.recording-title');
      if (recordButtonTitle) {
          recordButtonTitle.textContent = getTranslation('recordButtonStart');
      }

      console.error('Microphone error in popup (unhandled type):', error.name, error.message);
    }


    // Start recording
    function startRecording() {
      console.log("Popup: Attempting to start recording...");
      console.log("Popup: Calling navigator.mediaDevices.getUserMedia({ audio: true })...");
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          console.log("Popup: getUserMedia successful in startRecording. Stream:", stream);
          if (stream.getTracks().length > 0) {
            console.log("Popup: Stream has tracks. First track state:", stream.getTracks()[0].readyState);
          } else {
            console.warn("Popup: getUserMedia succeeded but stream has no tracks.");
            handleMicrophoneError(new Error("Stream has no audio tracks"));
            return;
          }

          console.log("Popup: Creating MediaRecorder...");
          try {
            mediaRecorder = new MediaRecorder(stream);
            console.log("Popup: MediaRecorder created successfully."); // Added log
          } catch (recorderError) {
             console.error("Popup: Error creating MediaRecorder:", recorderError);
             handleMicrophoneError(recorderError);
             stream.getTracks().forEach(track => track.stop());
             return;
          }
          audioChunks = [];

          mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) { // Check chunk size
              console.log(`Popup: MediaRecorder dataavailable event. Chunk size: ${event.data.size}`); // Log chunk size
              audioChunks.push(event.data);
            } else {
              console.log("Popup: MediaRecorder dataavailable event with empty chunk."); // Log empty chunk
            }
          });

          mediaRecorder.addEventListener('stop', () => {
             console.log("Popup: MediaRecorder stop event. Total chunks:", audioChunks.length); // Log chunk count on stop
             processRecording();
          });

          mediaRecorder.addEventListener('error', (event) => { // Added error listener
             console.error("Popup: MediaRecorder error event:", event.error);
             handleMicrophoneError(event.error || new Error("MediaRecorder error"));
          });

          console.log("Popup: Calling mediaRecorder.start()...");
          mediaRecorder.start();
          console.log("Popup: mediaRecorder.start() called.");
          isRecording = true;

          console.log("Popup: Updating UI for recording state.");
          recordBtn.classList.add('recording');
            const recordButtonTitle = recordBtn.querySelector('.recording-title');
  if (recordButtonTitle) {
    recordButtonTitle.textContent = getTranslation('recordButtonStop');
  }
          statusEl.textContent = getTranslation('statusRecording');
          statusEl.classList.remove('error');
          statusEl.classList.add('recording');

          // Update status section for recording state
          const statusSection = document.querySelector('.status-section');
          if (statusSection) {
            statusSection.classList.remove('error', 'processing');
            statusSection.classList.add('recording');
          }

          if (!resultEl.classList.contains('hasText')) {
               resultEl.textContent = getTranslation('resultPlaceholder');
           }
           resultEl.classList.remove('hasText');
           resultEl.setAttribute('contenteditable', 'false');

           if (copyBtn) copyBtn.disabled = true;
           if (editBtn) editBtn.disabled = true;
        })
        .catch(handleMicrophoneError); // Catch errors from getUserMedia itself
    }

    // Stop recording
    function stopRecording() {
      console.log("Popup: stopRecording called."); // Log stop
      if (mediaRecorder && isRecording) {
        console.log("Popup: Stopping MediaRecorder and tracks.");
        mediaRecorder.stop(); // This will trigger the 'stop' event listener which calls processRecording
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        isRecording = false;

        // Update UI immediately to 'Processing'
        recordBtn.classList.remove('recording');
        const recordButtonTitle = recordBtn.querySelector('.recording-title');
         if (recordButtonTitle) {
             recordButtonTitle.textContent = getTranslation('recordButtonStart');
         }
        statusEl.textContent = getTranslation('statusProcessing');
        statusEl.classList.remove('recording');
        statusEl.classList.add('processing');

        // Update status section for processing state
        const statusSection = document.querySelector('.status-section');
        if (statusSection) {
          statusSection.classList.remove('recording', 'error');
          statusSection.classList.add('processing');
        }
      } else {
        console.log("Popup: stopRecording called but no active recorder or not recording.");
      }
    }

    // Process recording
/* ---- Tab Audio Capture Functions ---- */
let isTabRecording = false;
let tabMediaRecorder = null;
let tabAudioChunks = [];
let tabPlayback = null; // play captured audio so the tab is not muted

/* ---- Desktop Audio Capture Variables ---- */
let isDesktopRecording = false;
let desktopMediaRecorder = null;
let desktopAudioChunks = [];
let desktopPlayback = null;

function toggleTabRecording() {
  if (isTabRecording) {
    stopTabRecording();
  } else {
    startTabRecording();
  }
}

function startTabRecording() {
  if (!settings.apiKey) {
    openSettingsModal();
    return;
  }
  console.log("Popup: Starting tab audio capture...");
  chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
    if (chrome.runtime.lastError || !stream) {
      console.error("Popup: tabCapture error:", chrome.runtime.lastError);
      statusEl.textContent = getTranslation('statusError');
      statusEl.classList.add('error');
      return;
    }
    tabMediaRecorder = new MediaRecorder(stream);
    tabAudioChunks = [];
    tabMediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) tabAudioChunks.push(e.data);
    });
    tabMediaRecorder.addEventListener('stop', processTabRecording);
    tabMediaRecorder.start();

    /* keep audio audible while capturing */
    try {
      tabPlayback = new Audio();
      tabPlayback.srcObject = stream;
      tabPlayback.volume = 1;
      // play() returns a promise – ignore rejection if autoplay blocked
      tabPlayback.play().catch(() => {});
    } catch (e) { console.warn('Could not start tab playback', e); }

    isTabRecording = true;
    if (tabRecordBtn) tabRecordBtn.classList.add('recording');
    statusEl.textContent = 'Recording tab audio... Click to stop';
  });
}

function stopTabRecording() {
  if (tabMediaRecorder && isTabRecording) {
    tabMediaRecorder.stop();
    tabMediaRecorder.stream.getTracks().forEach(t => t.stop());
    isTabRecording = false;
    if (tabRecordBtn) tabRecordBtn.classList.remove('recording');
    statusEl.textContent = getTranslation('statusProcessing');
    statusEl.classList.add('processing');

    if (tabPlayback) {
      tabPlayback.pause();
      tabPlayback.srcObject = null;
      tabPlayback = null;
    }
  }
}

async function processTabRecording() {
  if (tabAudioChunks.length === 0) {
    statusEl.textContent = getTranslation('statusError');
    statusEl.classList.add('error');
    return;
  }
  const audioBlob = new Blob(tabAudioChunks, { type: 'audio/webm;codecs=opus' });
  tabAudioChunks = [];
  statusEl.textContent = getTranslation('statusTranscribing');
  try {
    const result = await transcribeAudioWithoutEvents(audioBlob);
    statusEl.textContent = getTranslation('statusDone');
    if (result && result.text) {
      // --- Set text direction based on detected language ---
      if (settings.language === 'auto' && result.language) {
        if (isRtlLang(result.language)) {
          resultEl.classList.add('rtl-text');
        } else {
          resultEl.classList.remove('rtl-text');
        }
      }
      // Hide placeholder and show transcribed text
      const placeholder = resultEl.querySelector('.result-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      resultEl.textContent = result.text;
      resultEl.classList.add('hasText');

      // --- mirror microphone flow: history / clipboard / insert ---
      saveHistory(result.text);
      if (copyBtn) copyBtn.disabled = false;
      if (editBtn) editBtn.disabled = false;

      if (settings.autoCopy) {
        navigator.clipboard.writeText(result.text)
          .catch(err => console.error('Popup: Auto-copy (tab) failed:', err));
      }

      if (settings.autoInsert) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'insertText',
              text: result.text
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Popup: Error sending insertText message (tab):', chrome.runtime.lastError.message);
              }
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Popup: Tab transcription error:', err);
    statusEl.textContent = getTranslation('statusError');
    statusEl.classList.add('error');
  }
}
/* ---- End Tab Audio Capture ---- */

/* ---- Desktop Audio Capture Functions ---- */
function toggleDesktopRecording() {
  if (isDesktopRecording) {
    stopDesktopRecording();
  } else {
    startDesktopRecording();
  }
}

async function startDesktopRecording() {
  if (!settings.apiKey) {
    openSettingsModal();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
    desktopMediaRecorder = new MediaRecorder(stream);
    desktopAudioChunks = [];
    desktopMediaRecorder.addEventListener('dataavailable', (e) => {
      if (e.data.size > 0) desktopAudioChunks.push(e.data);
    });
    desktopMediaRecorder.addEventListener('stop', processDesktopRecording);
    desktopMediaRecorder.start();

    /* For desktop capture, system audio is already audible.
       Do NOT loop it back to avoid double-audio. */

    isDesktopRecording = true;
    if (desktopRecordBtn) desktopRecordBtn.classList.add('recording');
    statusEl.textContent = 'Recording desktop audio... Click to stop';
  } catch (err) {
    console.error('Popup: desktop capture error:', err);
    statusEl.textContent = getTranslation('statusError');
    statusEl.classList.add('error');
  }
}

function stopDesktopRecording() {
  if (desktopMediaRecorder && isDesktopRecording) {
    desktopMediaRecorder.stop();
    desktopMediaRecorder.stream.getTracks().forEach(t => t.stop());
    isDesktopRecording = false;
    if (desktopRecordBtn) desktopRecordBtn.classList.remove('recording');
    statusEl.textContent = getTranslation('statusProcessing');
    statusEl.classList.add('processing');
    /* no extra playback to stop */
  }
}

async function processDesktopRecording() {
  if (desktopAudioChunks.length === 0) {
    statusEl.textContent = getTranslation('statusError');
    statusEl.classList.add('error');
    return;
  }
  const audioBlob = new Blob(desktopAudioChunks, { type: 'audio/webm;codecs=opus' });
  desktopAudioChunks = [];
  statusEl.textContent = getTranslation('statusTranscribing');
  try {
    const result = await transcribeAudioWithoutEvents(audioBlob);
    statusEl.textContent = getTranslation('statusDone');
    if (result && result.text) {
      // --- Set text direction based on detected language ---
      if (settings.language === 'auto' && result.language) {
        if (isRtlLang(result.language)) {
          resultEl.classList.add('rtl-text');
        } else {
          resultEl.classList.remove('rtl-text');
        }
      }
      // Hide placeholder and show transcribed text
      const placeholder = resultEl.querySelector('.result-placeholder');
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      resultEl.textContent = result.text;
      resultEl.classList.add('hasText');
      saveHistory(result.text);
      if (copyBtn) copyBtn.disabled = false;
      if (editBtn) editBtn.disabled = false;
      if (settings.autoCopy) {
        navigator.clipboard.writeText(result.text).catch(() => {});
      }
      if (settings.autoInsert) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'insertText', text: result.text }, () => {});
          }
        });
      }
    }
  } catch (err) {
    console.error('Popup: Desktop transcription error:', err);
    statusEl.textContent = getTranslation('statusError');
    statusEl.classList.add('error');
  }
}
/* ---- End Desktop Audio Capture ---- */

async function processRecording() {
      console.log("Popup: processRecording started."); // Log start
      if (audioChunks.length === 0) {
        console.warn("Popup: processRecording - No audio chunks recorded."); // Log no chunks
        statusEl.textContent = getTranslation('statusError'); // Or a more specific message
        statusEl.classList.remove('processing');
        statusEl.classList.add('error');
        resultEl.textContent = "No audio was recorded."; // Inform user
        if (copyBtn) copyBtn.disabled = true;
        if (editBtn) editBtn.disabled = true;
        return;
      }

      try {
        const audioBlob = new Blob(audioChunks, {
          type: 'audio/webm;codecs=opus' // Ensure this matches what MediaRecorder produces
        });
        console.log(`Popup: Created audio blob. Size: ${audioBlob.size}, Type: ${audioBlob.type}`); // Log blob info
        audioChunks = []; // Clear chunks for next recording

        statusEl.textContent = getTranslation('statusTranscribing');
        console.log("Popup: Calling transcribeAudioWithoutEvents..."); // Log API call start

        const result = await transcribeAudioWithoutEvents(audioBlob);
        console.log("Popup: Transcription API result:", result); // Log API result

        statusEl.textContent = getTranslation('statusDone');
        statusEl.classList.remove('processing');

        if (result && result.text) {
          const transcribedText = result.text;
          console.log(`Popup: Transcription successful. Text: "${transcribedText}"`);

          // --- Set text direction based on detected language from the text content ---
          if (settings.language === 'auto') {
            if (isRtlText(transcribedText)) {
              resultEl.classList.add('rtl-text');
            } else {
              resultEl.classList.remove('rtl-text');
            }
          }
          
          // Hide placeholder and show transcribed text
          const placeholder = resultEl.querySelector('.result-placeholder');
          if (placeholder) {
            placeholder.style.display = 'none';
          }
          resultEl.textContent = transcribedText;
          resultEl.classList.add('hasText');

          // Update status section to show completion
          const statusSection = document.querySelector('.status-section');
          if (statusSection) {
            statusSection.classList.remove('recording', 'error', 'processing');
          }

          if (settings.autoInsert) {
            console.log("Popup: Auto-insert enabled. Sending message to content script."); // Log auto-insert
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs && tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: 'insertText',
                  text: transcribedText
                }, (response) => {
                  if (chrome.runtime.lastError) {
                    console.error('Popup: Error sending insertText message:', chrome.runtime.lastError.message);
                  } else {
                    console.log("Popup: Text insertion message sent successfully.");
                  }
                });
              } else {
                 console.warn("Popup: Could not find active tab to insert text.");
              }
            });
          }

          if (copyBtn) copyBtn.disabled = false;
          if (editBtn) editBtn.disabled = false;

          if (settings.autoCopy) {
            console.log("Popup: Auto-copy enabled. Copying to clipboard."); // Log auto-copy
            navigator.clipboard.writeText(transcribedText)
              .then(() => console.log('Popup: Auto-copied to clipboard.'))
              .catch(err => console.error('Popup: Auto-copy failed:', err));
          }

          saveHistory(transcribedText);

        } else {
           console.log("Popup: Transcription result empty or missing text field."); // Log empty result
           
           // Show placeholder again
           const placeholder = resultEl.querySelector('.result-placeholder');
           if (placeholder) {
             placeholder.style.display = 'flex';
           } else {
             resultEl.innerHTML = '<div class="result-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; opacity: 0.3;"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg><p>' + getTranslation('resultPlaceholder') + '</p></div>';
           }
           resultEl.classList.remove('hasText');
           if (copyBtn) copyBtn.disabled = true;
           if (editBtn) editBtn.disabled = true;
           resultEl.setAttribute('contenteditable', 'false');
        }
      } catch (error) {
        console.error('Popup: Error processing recording:', error); // Log processing error
        statusEl.textContent = getTranslation('statusError');
        statusEl.classList.remove('processing');
        statusEl.classList.add('error');

        // Update status section for error state
        const statusSection = document.querySelector('.status-section');
        if (statusSection) {
          statusSection.classList.remove('recording', 'processing');
          statusSection.classList.add('error');
        }

        let errorMessage = 'An unexpected error occurred';
        if (error.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.detail) {
          errorMessage = error.detail;
        }

        // Hide placeholder and show error message
        const placeholder = resultEl.querySelector('.result-placeholder');
        if (placeholder) {
          placeholder.style.display = 'none';
        }
        resultEl.textContent = 'Error: ' + errorMessage;
        resultEl.classList.remove('hasText');
         if (copyBtn) copyBtn.disabled = true;
         if (editBtn) editBtn.disabled = true;
         resultEl.setAttribute('contenteditable', 'false');
      }
    }

    // Transcribe audio without events
    async function transcribeAudioWithoutEvents(audioBlob) {
      console.log("Popup: transcribeAudioWithoutEvents called."); // Log function call
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm'); // Added filename
      formData.append('model_id', 'scribe_v1');
      // Removed unnecessary parameters as per API docs for basic transcription
      // formData.append('timestamps_granularity', 'none');
      // formData.append('diarize', 'false');

      // Only append language_code if a specific language is selected (not 'auto')
      if (settings.language !== 'auto') {
        const languageCode = settings.language.split('-')[0];
        console.log(`Popup: Sending specific language code: ${languageCode}`); // Log language
        formData.append('language_code', languageCode);
      } else {
        console.log("Popup: Using automatic language detection."); // Log auto detection
      }

      console.log("Popup: Making API request to Eleven Labs..."); // Log API request start
      const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': settings.apiKey,
          'Accept': 'application/json'
        },
        body: formData
      });
      console.log(`Popup: API response status: ${response.status}`); // Log status

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
          console.error("Popup: API Error Response Body:", errorData); // Log error body
        } catch(e) {
          console.error("Popup: Could not parse API error response body.");
        }
        let errorMessage = 'API error';
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          errorMessage = `API error (${response.status} ${response.statusText})`;
        }
        console.error(`Popup: API request failed: ${errorMessage}`); // Log failure reason
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("Popup: API response data received.");
      return responseData;
    }

    // Modal functions
    function openSettingsModal() {
      settingsModal.classList.add('open');
    }

    function openHelpModal() {
      helpModal.classList.add('open');
    }

    function toggleHistory() {
      historyContainerEl.classList.toggle('visible');
    }

    // Toggle edit mode for the result text
    function toggleEditMode() {
      const isEditable = resultEl.getAttribute('contenteditable') === 'true';
      if (isEditable) {
        resultEl.setAttribute('contenteditable', 'false');
        resultEl.blur();
      } else {
        resultEl.setAttribute('contenteditable', 'true');
        resultEl.focus();
      }
    }

    // Copy result text to clipboard
    function copyResultText() {
      // Get text content, excluding the placeholder
      let textToCopy = '';
      if (resultEl.classList.contains('hasText')) {
        // Create a temporary element to extract just the text content without the placeholder
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = resultEl.innerHTML;
        const placeholder = tempDiv.querySelector('.result-placeholder');
        if (placeholder) {
          placeholder.remove();
        }
        textToCopy = tempDiv.textContent || tempDiv.innerText;
      }

      if (textToCopy && resultEl.classList.contains('hasText')) {
        navigator.clipboard.writeText(textToCopy)
          .then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.textContent = getTranslation('copiedToClipboard');
            copyBtn.style.width = 'auto';
            copyBtn.style.padding = '4px 8px';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.style.width = '';
                copyBtn.style.padding = '';
             }, 1500);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
          });
      }
    }

    // --- History Functions ---
    function loadHistory() {
      chrome.storage.local.get(['transcriptionHistory'], (result) => {
        if (result.transcriptionHistory) {
          transcriptionHistory = result.transcriptionHistory;
          updateHistoryDisplay();
        }
      });
    }

    function saveHistory(text) {
      if (!text) return;
      transcriptionHistory.unshift(text);
      transcriptionHistory = transcriptionHistory.slice(0, 5);
      chrome.storage.local.set({ transcriptionHistory }, () => {
        console.log('History saved:', transcriptionHistory);
        updateHistoryDisplay();
      });
    }

    function updateHistoryDisplay() {
        historyListEl.innerHTML = '';
        if (transcriptionHistory.length === 0) {
          const li = document.createElement('li');
          li.textContent = getTranslation('historyEmpty');
          li.style.cursor = 'default';
          li.style.color = 'var(--text-light)';
        historyListEl.appendChild(li);
      } else {
        transcriptionHistory.forEach(text => {
          const li = document.createElement('li');
          li.textContent = text;
          li.addEventListener('click', () => {
            navigator.clipboard.writeText(text)
              .then(() => {
                const originalColor = li.style.color;
                const originalTextContent = li.textContent;
                li.style.color = 'var(--success)';
                li.textContent = getTranslation('historyItemCopied');
                setTimeout(() => {
                  li.textContent = originalTextContent;
                  li.style.color = originalColor;
                }, 1500);
              })
              .catch(err => console.error('Failed to copy history text:', err));
          });
          historyListEl.appendChild(li);
        });
      }
    }

    // --- RTL Language Detection from Text Content ---
    function isRtlText(text) {
        // This regex checks for a substantial presence of Hebrew or Arabic characters.
        // It looks for at least one character in the RTL scripts.
        const rtlRegex = /[\u0590-\u05FF\u0600-\u06FF]/;
        return rtlRegex.test(text);
    }

    // Apply RTL styles
    function applyRtlStyles(language) {
      const isRtl = language === 'he' || language === 'ar';
      if (isRtl) {
        document.body.classList.add('rtl-layout');
        resultEl.classList.add('rtl-text');
        historyListEl.classList.add('rtl-text');
        statusEl.classList.add('rtl-text');
      } else {
        document.body.classList.remove('rtl-layout');
        resultEl.classList.remove('rtl-text');
        historyListEl.classList.remove('rtl-text');
        statusEl.classList.remove('rtl-text');
      }
    }

    // --- i18n Functions ---
    function getTranslation(key, lang = settings.language) {
      return translations[lang]?.[key] || translations.en[key] || key;
    }

    function updateUIText(lang) {
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        // Include more heading levels such as h3 and h4 to ensure all translatable text gets updated
        if (element.matches('span, h1, h2, h3, h4, label, button, p, strong, div')) {
           if (key === 'recordButtonStart' && element.classList.contains('recording-title')) {
               if (!isRecording) {
                   element.textContent = getTranslation(key, lang);
               }
           }
           else if (key === 'statusInitial' && element.id === 'status') {
               if (!isRecording && !statusEl.classList.contains('processing') && !statusEl.classList.contains('error')) {
                   element.textContent = getTranslation(key, lang);
               }
           }
           else {
               element.textContent = getTranslation(key, lang);
           }
        }
      });
       document.querySelectorAll('[data-i18n-title]').forEach(element => {
          const key = element.getAttribute('data-i18n-title');
          element.setAttribute('title', getTranslation(key, lang));
       });
       document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
          const key = element.getAttribute('data-i18n-placeholder');
           if (!element.classList.contains('hasText')) {
              element.textContent = getTranslation(key, lang);
           }
       });

       if (!isRecording && !statusEl.classList.contains('processing') && !statusEl.classList.contains('error')) {
          statusEl.textContent = getTranslation('statusInitial', lang);
       }
         const recordButtonTitle = recordBtn.querySelector('.recording-title');
  if (recordButtonTitle && !isRecording) {
    recordButtonTitle.textContent = getTranslation('recordButtonStart', lang);
  }
       updateHistoryDisplay();
      }

  }, 0); // End of setTimeout
}); // End of DOMContentLoaded
