document.addEventListener('DOMContentLoaded', () => {
  const requestBtn = document.getElementById('requestPermission');
  const statusEl = document.getElementById('status');

  // Function to handle showing messages and button state
  function updateStatus(message, type = 'info', hideButton = false) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status ${type}`; // type can be 'success', 'error', or empty for info
    if (requestBtn) {
      requestBtn.style.display = hideButton ? 'none' : 'block';
      requestBtn.disabled = (type === 'error' || type === 'info') ? false : true; // Disable only on success initially
    }
  }

  // --- Initial Permission Check on Page Load ---
  async function checkInitialPermission() {
    if (!requestBtn || !statusEl) {
       console.error('Initial check failed: Missing button or status element.');
       updateStatus('Error: Page elements missing.', 'error');
       return;
    }

    console.log('Performing initial microphone check on page load...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log('Initial check successful: Access already granted.');
      updateStatus('Microphone access already granted! You can close this tab.', 'success', true);
      chrome.storage.local.set({ microphonePermissionGranted: true }); // Ensure flag is set
    } catch (error) {
      console.warn('Initial check failed:', error.name);
      let initialMessage = 'Microphone access is needed.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        initialMessage = 'Microphone access is currently denied. Please click the button below to request access, or check site settings (lock/camera icon in address bar).';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        initialMessage = 'No microphone found. Please ensure one is connected and enabled.';
      } else {
        initialMessage = `Could not check microphone status (${error.name}). Click the button to try requesting access.`;
      }
      updateStatus(initialMessage, 'info'); // Show info/prompt, keep button enabled
    }
  }

  // --- Button Click Handler ---
  if (requestBtn) {
    requestBtn.addEventListener('click', async () => {
      // Re-fetch elements just in case, though less critical now
      const currentRequestBtn = document.getElementById('requestPermission');
      const currentStatusEl = document.getElementById('status');

      if (!currentRequestBtn || !currentStatusEl) {
        console.error('Click handler: Missing button or status element.');
        return;
      }

      console.log('Request button clicked.');
      updateStatus('Requesting access...', 'info'); // Show requesting message
      currentRequestBtn.disabled = true; // Disable button during request

      try {
        // Request microphone permission via button click
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Success via button click
        stream.getTracks().forEach(track => track.stop());
        console.log('Button click request successful.');
        updateStatus('Microphone access granted! You can now close this tab.', 'success', true);
        chrome.storage.local.set({ microphonePermissionGranted: true });
      } catch (error) {
        // Error via button click
        console.error("Button click permission error:", error);
        let message = `An error occurred: ${error.name}. Please check the browser console for details.`;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          message = 'Microphone access was denied. Please click the lock or camera icon in the address bar, go to site settings, and ensure Microphone access is set to "Allow" for this extension page.';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          message = 'No microphone found. Please ensure a microphone is connected and enabled in your system settings.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          message = 'Microphone is currently unavailable. It might be in use by another application or blocked by hardware/system settings.';
        } // Keep other generic messages from previous version
        
        updateStatus(message, 'error'); // Show error, keep button enabled
      }
    });
  } else {
    // This error happens if the button wasn't found initially by DOMContentLoaded
    console.error('Setup Error: Could not find requestPermission button.');
    updateStatus('Error: Page setup failed. Cannot find button.', 'error');
  }

  // --- Run the initial check ---
  checkInitialPermission();

}); // Closing brace for DOMContentLoaded
