/**
 * SCRIBE Voice Input - Content Script
 * Handles insertion of transcribed text into active input elements
 */

let lastFocusedEditableElement = null;

// Track the last focused element
document.addEventListener('focusin', (event) => {
  if (isEditableElement(event.target)) {
    lastFocusedEditableElement = event.target;
    console.log('Tracked focus on:', lastFocusedEditableElement);
  }
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  if (request.action === 'insertText') {
    const inserted = insertTextIntoActiveElement(request.text);
    sendResponse({ success: inserted });
  }
});

/**
 * Inserts text into the currently active element
 * @param {string} text - The text to insert
 * @returns {boolean} - Whether the text was successfully inserted
 */
function insertTextIntoActiveElement(text) {
  if (!text) return false;

  let targetElement = null;

  // 1. Try the last focused element if it's still valid
  if (lastFocusedEditableElement && lastFocusedEditableElement.isConnected && isEditableElement(lastFocusedEditableElement)) {
    targetElement = lastFocusedEditableElement;
    console.log('Using last focused element:', targetElement);
  } else {
    // 2. Fallback to document.activeElement
    targetElement = document.activeElement;
    console.log('Falling back to active element:', targetElement);
  }

  // 3. Check if the determined target is editable
  if (!isEditableElement(targetElement)) {
    // Check if active element is an iframe, maybe focus is inside
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') {
       console.warn('Focused element is an iframe. Cannot insert text directly. Try focusing an input field inside the iframe if possible.');
    } else {
       console.warn('No editable element determined or focused.');
    }
    lastFocusedEditableElement = null; // Reset if invalid
    return false;
  }

  // Ensure the target element actually has focus before inserting
  // This helps prevent inserting into an element that *was* focused but lost it
  // in a way the focusin listener didn't catch (e.g. programmatic blur)
  if (document.activeElement !== targetElement) {
     console.log('Target element lost focus, attempting to refocus...');
     targetElement.focus();
     // Re-check active element after attempting focus
     if (document.activeElement !== targetElement) {
        console.warn('Failed to refocus the target element. Aborting insertion.');
        lastFocusedEditableElement = null; // Reset
        return false;
     }
     console.log('Refocus successful.');
  }


  // Handle different types of elements
  if (targetElement.tagName === 'TEXTAREA' ||
      (targetElement.tagName === 'INPUT' &&
       (targetElement.type === 'text' ||
        targetElement.type === 'search' ||
        targetElement.type === 'email' ||
        targetElement.type === 'url' ||
        targetElement.type === 'tel' ||
        targetElement.type === 'number' ||
        targetElement.type === 'password'))) {

    // Handle standard input fields
    const startPos = targetElement.selectionStart;
    const endPos = targetElement.selectionEnd;

    const beforeText = targetElement.value.substring(0, startPos);
    const afterText = targetElement.value.substring(endPos);

    // Update the value
    targetElement.value = beforeText + text + afterText;

    // Set the cursor position after the inserted text
    const newCursorPos = startPos + text.length;
    targetElement.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger input event for react and other frameworks
    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  } else if (targetElement.isContentEditable) { // Use isContentEditable property
    // Handle contentEditable elements like rich text editors

    // Get the current selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      // Get the current range
      const range = selection.getRangeAt(0);

      // Check if the range is within our target element
      if (!targetElement.contains(range.commonAncestorContainer)) {
         console.warn('Selection is not within the target contentEditable element. Focusing element.');
         // If selection is lost, try to focus and place cursor at the end
         targetElement.focus();
         range.selectNodeContents(targetElement);
         range.collapse(false); // Collapse to the end
         selection.removeAllRanges();
         selection.addRange(range);
      }

      // Delete any selected content
      range.deleteContents();

      // Insert the new text
      const textNode = document.createTextNode(text);
      range.insertNode(textNode);

      // Move the cursor after the inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      // Trigger input event
      targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }
  }
    
  console.warn('Target element type not supported for insertion:', targetElement.tagName);
  return false;
}

/**
 * Checks if an element is an editable input element
 * @param {Element} element - The element to check
 * @returns {boolean} - Whether the element is editable
 */
function isEditableElement(element) {
  if (!element) return false;
  
  // Check if it's a common input element
  if (element.tagName === 'TEXTAREA') return true;
  
  if (element.tagName === 'INPUT') {
    const inputType = element.type?.toLowerCase();
    return (inputType === 'text' || 
            inputType === 'search' || 
            inputType === 'email' || 
            inputType === 'url' || 
            inputType === 'tel' || 
            inputType === 'number' || 
            inputType === 'password');
  }
  
  // Check if it's a contentEditable element
  if (element.isContentEditable || element.contentEditable === 'true') return true;
  
  return false;
}
