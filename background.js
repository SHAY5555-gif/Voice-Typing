/**
 * SCRIBE Voice Input - Background Script
 * Handles keyboard shortcuts, permission checks, opening popups/permission page, and maintains extension state
 */

// --- Helper Functions ---

// Opens the standard language-specific popup
async function openNormalPopup(triggerRecording = false) {
  console.log('Attempting to open normal popup...');
  try {
    const result = await chrome.storage.sync.get(['language']);
    const language = result.language || 'en'; // Default to English
    const isRtl = language === 'he' || language === 'ar';
    const popupFile = isRtl ? 'popup_he.html' : 'popup_en.html';

    console.log(`Attempting to set popup to: ${popupFile}`);
    await chrome.action.setPopup({ popup: popupFile });
    console.log(`Successfully set popup to: ${popupFile}`);

    console.log('Attempting to open popup...');
    chrome.action.openPopup();
    console.log('Called chrome.action.openPopup()');

    if (triggerRecording) {
      console.log('Triggering recording via message...');
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: 'triggerRecording' })
          .catch(err => console.warn("Popup not ready yet or closed when sending triggerRecording:", err));
      }, 300);
    }
  } catch (error) {
    console.error('Error opening normal popup:', error);
  }
}

// Opens or focuses the microphone permission page
async function openPermissionPage() {
  console.log('--- openPermissionPage function called ---');
  const permissionPageUrl = chrome.runtime.getURL('microphone.html');
  console.log('Permission page URL:', permissionPageUrl);
  try {
    // Simply open a new tab. Using only chrome.tabs.create does not require the "tabs" permission.
    const newTab = await chrome.tabs.create({ url: permissionPageUrl });
    console.log(`Created permission page tab with ID ${newTab.id}.`);
  } catch (error) {
    console.error('Error creating permission page tab:', error);
  }
}

// --- Main Logic Handler ---

// Decides action (called by listeners) - Simplified: Always try to open normal popup
async function handleAction(triggerRecording = false) {
  // The popup script will handle permission checks before recording
  console.log('Action triggered. Calling openNormalPopup...');
  openNormalPopup(triggerRecording);
}

// --- Event Listeners ---

chrome.action.onClicked.addListener(() => {
  console.log('Extension icon clicked.');
  handleAction(false); // Directly call the simplified handler
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle_recording') {
    console.log('Keyboard shortcut received.');
    handleAction(true); // Directly call the simplified handler
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsSaved') {
    console.log('Settings saved message received.');
    sendResponse({ success: true });
  } else if (request.action === 'openPermissionPage') {
    console.log('Received request from popup to open permission page.');
    openPermissionPage(); // Call the helper function
    sendResponse({ success: true }); // Acknowledge
  } else if (request.action === 'checkMicPermission') {
    // Allow other scripts (like popup) to check permission state if needed
    console.log('Received request to check mic permission state.');
    navigator.permissions.query({ name: 'microphone' })
      .then(status => sendResponse({ state: status.state }))
      .catch(error => {
        console.error("Error querying mic permission for message:", error);
        sendResponse({ error: error.message });
      });
    return true; // Indicates async response
  }
  return true; // Keep channel open
});

// --- Installation / Update Logic ---
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Initialize default settings
    const defaultSettings = {
      language: 'auto', apiKey: '', activationMode: 'manual', autoInsert: true, autoCopy: false,
    };
    await chrome.storage.sync.set(defaultSettings);
    console.log('Default settings initialized');

    // On install, use direct check and open info page if it fails
    try {
      console.log('onInstalled: Attempting direct getUserMedia check...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('onInstalled: getUserMedia check successful. Permission already granted.');
    } catch (installError) {
      console.warn('onInstalled: getUserMedia check failed:', installError.name);
      // If getUserMedia failed, assume permission is needed and open page
      console.log('onInstalled: Opening permission page because initial check failed.');
      openPermissionPage(); // Use the helper function
    }
  } else if (details.reason === 'update') {
    console.log('Extension updated to version', chrome.runtime.getManifest().version);
    // Handle updates if needed
  }
});
