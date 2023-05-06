// ==UserScript==
// @name         Copy Code Blocks from Bing Chats
// @namespace    http://tampermonkey.net/
// @version      0.7
// @description  A script that adds a copy button to each code block in bing chats
// @match        https://www.bing.com/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    // A function that returns a copyCode function with a reference to the code block element
      function createCopyCode(codeBlock, codeBlocks) {
        return function(e) {
          let text = "";
          for (let codeBlock of codeBlocks) {
            let checkbox = codeBlock.querySelector(".copy-checkbox");
            if (checkbox && checkbox.checked) {
              text += codeBlock.innerText.replace("Copy\n", "") + "\n";
            }
          }
            if (text === ""){
                text = codeBlock.innerText.replace("Copy\n","")
            }
            GM_setClipboard(text);
            // Show a confirmation message using a temporary span element
            let span = document.createElement("span");
            span.className = "copy-message";
            span.textContent = "Copied!";
            span.style.color = "green";
            span.style.marginLeft = "5px";
            span.style.opacity = "1";
            e.target.parentElement.appendChild(span);
            // Fade away and remove the span element after 3 seconds
            setTimeout(function() {
                let fade = setInterval(function() {
                    if (span.style.opacity > 0) {
                        span.style.opacity -= 0.1;
                    } else {
                        clearInterval(fade);
                        span.remove();
                    }
                }, 100);
            }, 3000);
        };
    }
function modifyClipboardOnPaste(textarea) {
    // Add a paste event listener to the textarea element
    textarea.addEventListener("paste", function(e) {
      // Wait for 100 milliseconds for the textarea to update
      setTimeout(function() {
        // Get the value of the textarea and its length
        let value = textarea.value;
        let length = value.length;
        // Define a function that returns a promise that resolves to the clipboard text
        let clipboardText = function() {
          return navigator.clipboard.readText();
        };
        // Use the then method on the clipboardText function to get the clipboard text and perform the rest of the logic
        clipboardText().then(function(clipboardText) {
          // Check if the clipboard text length exceeds the character limit of 4000
          if (clipboardText.length > 4000) {
            // Get the last 600 characters of the value as the search string
            let searchString = value.slice(-600);
            // Find the index of the search string in the clipboard text
            let index = clipboardText.indexOf(searchString);
            // Check if the index is not -1, meaning the search string was found
            if (index !== -1) {
              // Remove everything from the beginning to the index plus 600 from the clipboard text
              clipboardText = clipboardText.slice(index + 600);
              // Set the new clipboard text using the GM_setClipboard function
              GM_setClipboard(clipboardText);
            }
          }
        });
      }, 100);
    });
  }; // Add a closing parenthesis and a semicolon here
    // A function that traverses the entire DOM tree and checks for shadow roots and code blocks at each node
    function traverseDOM(node) {
        // If the node has a shadowRoot property, call the function recursively on the shadow root node
        if (node.shadowRoot) {
            traverseDOM(node.shadowRoot);
        }
        // If the node has a querySelectorAll method, use it to get all the code blocks under the node and add copy buttons to them if they don't have one already
        if (node.querySelectorAll) {
                let textareas = node.querySelectorAll("textarea");
    for (let textarea of textareas) {
      if (textarea.id === "searchbox") {
        modifyClipboardOnPaste(textarea);
      }
    }



            let codeBlocks = node.querySelectorAll("pre > code");
            for (let codeBlock of codeBlocks) {
                let copyButton = codeBlock.querySelector(".copy-button");
                if (!copyButton) {
                   let div = document.createElement("div");
div.className = "copy-container";
codeBlock.parentElement.insertBefore(div, codeBlock);

let checkbox = document.createElement("input");
checkbox.type = "checkbox";
checkbox.className = "copy-checkbox";
div.appendChild(checkbox);

// Create a span element to hold the helper text
let span = document.createElement("span");
span.className = "copy-helper";
span.textContent = "Multi-copy";
div.appendChild(span);

copyButton = document.createElement("button");
copyButton.className = "copy-button";
copyButton.textContent = "Copy";
copyButton.addEventListener("click", createCopyCode(codeBlock, codeBlocks));
div.appendChild(copyButton);

// Add some CSS styles to the div, input, span and button elements
div.style.display = "flex";
div.style.alignItems = "center";
div.style.marginBottom = "5px";
checkbox.style.marginRight = "5px";
span.style.marginRight = "5px";
span.style.display = "none"; // Hide the span by default
copyButton.style.padding = "5px 10px";
copyButton.style.borderRadius = "5px";
copyButton.style.backgroundColor = "#0078d4";
copyButton.style.color = "#ffffff";

// Add an event listener to show the span when the input is hovered over
checkbox.addEventListener("mouseover", function() {
  span.style.display = "inline"; // Show the span when hovered
});

// Add an event listener to hide the span when the input is not hovered over
checkbox.addEventListener("mouseout", function() {
  span.style.display = "none"; // Hide the span when not hovered
});

                    try {
                        codeBlock.insertBefore(div, codeBlock.firstChild);
                    } catch (error) {
                        console.error(error);
                    }
                }
            }
        }
        // If the node has child nodes, loop through them and call the function recursively on each child node
        if (node.childNodes) {
            for (let child of node.childNodes) {
                traverseDOM(child);
            }
        }
    }

    // A function that runs when the DOM changes and calls the traverseDOM function
    function onDOMChange(mutations) {
        // Loop through each mutation record and check if it added or removed any nodes or attributes to the DOM
        for (let mutation of mutations) {
            if (mutation.type === "childList" || mutation.type === "attributes") {
                // Call the traverseDOM function on the target node of the mutation record and any added or removed nodes
                traverseDOM(mutation.target);
                for (let addedNode of mutation.addedNodes) {
                    traverseDOM(addedNode);
                }
                for (let removedNode of mutation.removedNodes) {
                    traverseDOM(removedNode);
                }
            }
        }
    }

    // Create a new mutation observer and pass it the onDOMChange function
    let observer = new MutationObserver(onDOMChange);
    // Start observing the entire document for anytype of changes
    observer.observe(document, {childList: true, attributes: true, subtree: true});

    // A function that checks if the cib-feedback element is present in the DOM
    function isFeedbackReady() {
        // Use the traverseDOM function to get all the cib-feedback elements from any shadow roots
        let feedbackElements = [];
        traverseDOM(document.body, feedbackElements);
        // Return true if there is at least one cib-feedback element in the DOM, false otherwise
        return feedbackElements.length > 0;
    }
       // A function that adds a copy button to each code block in bing chats
    function addCopyButtons() {
        // Get all the code blocks in bing chats using the new selector
        let codeBlocks = document.querySelectorAll("pre > code");
        // Loop through each code block
        for (let codeBlock of codeBlocks) {
            // Check if the code block already has a copy button
            let copyButton = codeBlock.querySelector(".copy-button");
                if (!copyButton) {
                    let div = document.createElement("div");
                    div.className = "copy-container";
                    codeBlock.parentElement.insertBefore(div, codeBlock);

                    let checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.className = "copy-checkbox";
                    div.appendChild(checkbox);

                    copyButton = document.createElement("button");
                    copyButton.className = "copy-button";
                    copyButton.textContent = "Copy";
                    copyButton.addEventListener("click", createCopyCode(codeBlock));
                    div.appendChild(copyButton);

                    // Add some CSS styles to the div, input and button elements
                    div.style.display = "flex";
                    div.style.alignItems = "center";
                    div.style.marginBottom = "5px";
                    checkbox.style.marginRight = "5px";
                    copyButton.style.padding = "5px 10px";
                    copyButton.style.borderRadius = "5px";
                    copyButton.style.backgroundColor = "#0078d4";
                    copyButton.style.color = "#ffffff";
                    try {
                        codeBlock.insertBefore(div, codeBlock.firstChild);
                    } catch (error) {
                        console.error(error);
                    }
                }
        }
    }

    // A function that runs when the document is ready and calls the addCopyButtons function only if the cib-feedback element is present in the DOM
    function onDocumentReady() {
        // Check if the cib-feedback element is present in the DOM using the isFeedbackReady function
        if (isFeedbackReady()) {
            // Call the addCopyButtons function to add copy buttons to all code blocks in bing chats
            addCopyButtons();
        } else {
            // Wait for 100 milliseconds and try again
            setTimeout(onDocumentReady, 100);
        }
    }

    // Run the onDocumentReady function when the document is ready
    if (document.readyState === "complete" || document.readyState === "interactive") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }
})();