const fontSize = document.getElementById("fontSize");
const fontWeight = document.getElementById("fontWeight");
const lineHeight = document.getElementById("lineHeight");
const speechRate = document.getElementById("speechRate");
const notationList = document.getElementById("notationList");
const controls = document.getElementById("controls");
const popover = document.getElementById("notePopover");
const noteRefDisplay = document.getElementById("noteRef");
const liveDictation = document.getElementById("liveDictation");
const controlsToggle = document.querySelector(".controls-toggle");
const saveNoteButton = document.querySelector(".save-note-button");
const cancelNoteButton = document.querySelector(".cancel-note-button");
const startReadingButton = document.querySelector("#startReadingBtn");
const stopReadingButton = document.querySelector("#stopReadingBtn");
const addNoteButton = document.querySelector("#addNoteBtn");
const clearAllNotesButton = document.querySelector("#clearNotesBtn");

let currentReference = "";
let currentNote = "";
let sentences = [];
let readingIndex = 0;
let synth = window.speechSynthesis;
let currentUtterance;
let currentIndex = 0;
let words;
let textEl = document.getElementById("text"); // Assuming you're working with a `textEl` for the main content
let recognition;

controlsToggle.addEventListener("click", toggleControls);
startReadingButton.addEventListener("click", startReading);
stopReadingButton.addEventListener("click", stopReading);
addNoteButton.addEventListener("click", addNotation);
clearAllNotesButton.addEventListener("click", clearAllNotes);

function toggleControls() {
  controls.classList.toggle("visible");
}

fontSize.addEventListener("input", () => {
  textEl.style.fontSize = fontSize.value + "px";
});

fontWeight.addEventListener("input", () => {
  textEl.style.fontWeight = fontWeight.value;
});

lineHeight.addEventListener("input", () => {
  textEl.style.lineHeight = lineHeight.value;
});

saveNoteButton.addEventListener("click", saveNote);
cancelNoteButton.addEventListener("click", cancelNote);

// function startReading() {
//   if (synth.speaking) synth.cancel();

//   const text = textEl.innerText;
//   words = text.split(/\s+/); // Split the text into words

//   // Start reading the sentence
//   speakNext();
// }

// Function to speak the text of the focused element
function speakFocusedElement(event) {
  const element = event.target;

  let textToSpeak = "";

  // Check if the element has a label (for inputs, selects, etc.)
  if (
    element.tagName === "LABEL" ||
    element.tagName === "BUTTON" ||
    element.tagName === "INPUT" ||
    element.tagName === "SELECT"
  ) {
    textToSpeak =
      element.textContent.trim() ||
      element.getAttribute("aria-label") ||
      element.getAttribute("placeholder");
  }

  // Speak if there's any text to speak
  if (textToSpeak) {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    window.speechSynthesis.speak(utterance);
  }
}

// Attach the event listener for focus
document.addEventListener("focus", speakFocusedElement, true);

function speakNext() {
  if (currentIndex >= words.length) return;

  const word = words[currentIndex];
  currentUtterance = new SpeechSynthesisUtterance(word);
  currentUtterance.rate = parseFloat(speechRate.value);

  console.log("Speaking:", word);
  highlightText(word); // Highlight the current word

  currentUtterance.onend = () => {
    currentIndex++;
    speakNext(); // Continue with the next word
  };

  synth.speak(currentUtterance); // Speak the current word
}

function stopReading() {
  synth.cancel();
  clearHighlight();
}

function highlightText(word) {
  const html = textEl.innerText;
  const index = html.indexOf(word);

  if (index !== -1) {
    const before = html.substring(0, index);
    const match = html.substring(index, index + word.length);
    const after = html.substring(index + word.length);

    // Highlight the current word while keeping the sentence intact
    textEl.innerHTML = `${before}<span class="highlight">${match}</span>${after}`;
  }
}

function highlightReference() {
  const referenceLinks = document.querySelectorAll(".reference-link");

  referenceLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      // Get the reference word or sentence text
      const referenceText = this.textContent;
      const referenceId = this.getAttribute("href").substring(1); // Get the reference ID from href (#id)

      // Find the position of the reference in the text and highlight it
      const referenceElement = document.getElementById(referenceId);
      if (referenceElement) {
        referenceElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        referenceElement.classList.add("highlight");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", highlightReference);

function clearHighlight() {
  // Clear previous highlights by restoring the plain text
  textEl.innerHTML = textEl.innerText;
}

function addNotation() {
  // Stop reading if active
  stopReading();

  // Get the selected text, if any
  const selectedText = window.getSelection().toString().trim();

  if (selectedText) {
    // If a specific word or sentence is selected, use it as the reference
    currentReference = selectedText;
  } else {
    // Otherwise, default to the last sentence or word
    const sentences = textEl.innerText.split(/[.!?]\s+/); // Split the text into sentences
    const lastSentence = sentences[sentences.length - 1]; // Get the last sentence
    const words = lastSentence.split(/\s+/); // Split the last sentence into words
    currentReference = words[words.length - 1]; // Default to the last word
  }

  // Display selected reference in the popover
  document.getElementById("noteRef").textContent = currentReference;
  document.getElementById("liveDictation").textContent = ""; // Clear live dictation
  document.getElementById("notePopover").classList.remove("hidden"); // Show the popover

  // Start voice recognition for note input
  if (recognition) recognition.abort();
  recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = function (event) {
    currentNote = event.results[0][0].transcript;
    document.getElementById("liveDictation").textContent = currentNote;
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error:", event.error);
  };

  recognition.start();
}

function wrapTextWords() {
  const rawText = textArea.value;
  const words = rawText.split(/\b(\s+|\b)/); // Keeps punctuation & spacing
  let resultHTML = "";
  let wordIndex = 0;

  words.forEach((word) => {
    // Don't wrap empty strings or whitespace-only
    if (/\S/.test(word)) {
      resultHTML += `<span class="word" data-index="${wordIndex}">${word}</span>`;
      wordIndex++;
    } else {
      resultHTML += word; // Keep spacing intact
    }
  });

  textDisplay.innerHTML = resultHTML; // Replace textArea with <div id="textDisplay">
}

let currentWordIndex = 0;
let allWordSpans = [];

function startReading() {
  wrapTextWords();
  allWordSpans = document.querySelectorAll("#textDisplay .word");
  const sentence = Array.from(allWordSpans)
    .map((span) => span.textContent)
    .join("");

  const utterance = new SpeechSynthesisUtterance(sentence);
  utterance.rate = parseFloat(speechRate.value);

  utterance.onboundary = function (event) {
    if (event.name === "word") {
      highlightWord(currentWordIndex);
      currentWordIndex++;
    }
  };

  utterance.onend = () => {
    removeHighlights();
    currentWordIndex = 0;
  };

  speechSynthesis.speak(utterance);
}

function highlightWord(index) {
  removeHighlights();
  const word = allWordSpans[index];
  if (word) {
    word.classList.add("highlight");
    word.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function removeHighlights() {
  allWordSpans.forEach((span) => span.classList.remove("highlight"));
}

function saveNote() {
  const id = "ref-" + Date.now();
  const anchor = document.createElement("a");
  anchor.name = id;

  // Wrap the reference in a <span> tag with the ID of the reference link
  const referenceText = currentReference;
  const refIndex = textEl.innerText.indexOf(referenceText);

  if (refIndex !== -1) {
    const before = textEl.innerText.slice(0, refIndex);
    const after = textEl.innerText.slice(refIndex + referenceText.length);

    // Wrap the reference word in a <span> with the ID of the reference link
    textEl.innerHTML = `${before}<span id="${id}" class="reference-link">${referenceText}</span>${after}`;
  }

  // Save the note to the list
  const div = document.createElement("div");
  div.className = "notation-item";
  div.innerHTML = `<strong>Reference:</strong> <a href="#${id}" class="reference-link">${currentReference}</a><br><strong>Note:</strong> ${currentNote}`;

  // Attach a delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.onclick = function () {
    div.remove();
    let savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
    savedNotes = savedNotes.filter(
      (n) => !(n.reference === currentReference && n.note === currentNote)
    );
    localStorage.setItem("notes", JSON.stringify(savedNotes));
  };

  div.appendChild(deleteBtn);
  document.getElementById("notationList").appendChild(div);

  // Save the note to local storage
  const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
  savedNotes.push({ reference: currentReference, note: currentNote, id });
  localStorage.setItem("notes", JSON.stringify(savedNotes));

  // Hide the popover
  document.getElementById("notePopover").classList.add("hidden");
  if (recognition) recognition.stop();
}

function cancelNote() {
  document.getElementById("notePopover").classList.add("hidden");
  if (recognition) recognition.stop();
}

function clearAllNotes() {
  if (confirm("Are you sure you want to delete all saved notes?")) {
    notationList.innerHTML = "";
    localStorage.removeItem("notes");
  }
}

document.addEventListener("keydown", function (event) {
  if (event.altKey && event.key.toLowerCase() === "r") {
    startReading();
  } else if (event.altKey && event.key.toLowerCase() === "s") {
    stopReading();
  } else if (event.altKey && event.key.toLowerCase() === "n") {
    addNotation();
  } else if (event.key === "Escape") {
    cancelNote();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const savedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
  savedNotes.forEach(({ reference, note, id }) => {
    const div = document.createElement("div");
    div.className = "notation-item";
    div.innerHTML = `<strong>Reference:</strong> <a href="#${id}">${reference}</a><br><strong>Note:</strong> ${note}`;
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = function () {
      div.remove();
      let updatedNotes = JSON.parse(localStorage.getItem("notes") || "[]");
      updatedNotes = updatedNotes.filter(
        (n) => !(n.reference === reference && n.note === note)
      );
      localStorage.setItem("notes", JSON.stringify(updatedNotes));
    };
    div.appendChild(deleteBtn);
    notationList.appendChild(div);
  });
});
