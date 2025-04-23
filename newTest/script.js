// script.js

// Initialiseer spraaksynthese en DOM-elementen
const synth = window.speechSynthesis;
const startReadingBtn = document.getElementById("start-reading");
const stopReadingBtn = document.getElementById("stop-reading");
const makeNoteBtn = document.getElementById("make-note");
const noteDialog = document.getElementById("note-dialog");
const noteSentenceEl = document.getElementById("note-sentence");
const noteInput = document.getElementById("note-input");
const saveNoteBtn = document.getElementById("save-note");
const notesList = document.getElementById("notes-list");
const micBtn = document.getElementById("mic-btn");
const fontSizeSelect = document.getElementById("font-size");
const fontWeightSelect = document.getElementById("font-weight");
const speechSpeedSelect = document.getElementById("speech-speed");
const voiceSelect = document.getElementById("speech-voice");
const resetSettingsBtn = document.getElementById("reset-settings");
const toggleSettingsBtn = document.getElementById("toggle-settings");
const settingsPanel = document.getElementById("settings-panel");

// Status variabelen bijhouden
let lastSentence = "";
let speechSpeed = parseFloat(localStorage.getItem("speechSpeed")) || 1;
let resumeIndex = 0;
let fullSentences = [];
let voices = [];
let selectedVoiceURI = localStorage.getItem("selectedVoiceURI") || "";

// Vult de lijst met beschikbare stemmen
function populateVoices() {
  voices = synth.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice) => {
    const option = document.createElement("option");
    option.value = voice.voiceURI;
    option.textContent = `${voice.name} (${voice.lang})`;
    if (voice.voiceURI === selectedVoiceURI) {
      option.selected = true;
    }
    voiceSelect.appendChild(option);
  });
}

// Eventlistener voor wanneer de stemmen beschikbaar zijn
synth.onvoiceschanged = populateVoices;

// Functie om tekst voor te lezen
function speakText() {
  if (synth.speaking) synth.cancel();

  fullSentences = textEl.innerText.match(/[^.!?]+[.!?]+/g) || [
    textEl.innerText,
  ];
  const textToRead = fullSentences.slice(resumeIndex).join(" ");

  let fullUtterance = new SpeechSynthesisUtterance(textToRead);
  fullUtterance.rate = speechSpeed;
  if (selectedVoiceURI) {
    const voice = voices.find((v) => v.voiceURI === selectedVoiceURI);
    if (voice) fullUtterance.voice = voice;
  }

  // Markeert woorden tijdens het voorlezen
  fullUtterance.onboundary = (event) => {
    if (event.name === "word") {
      const wordStart = event.charIndex;
      const wordEnd = wordStart + event.charLength;
      const currentText = fullUtterance.text.slice(0, wordEnd);
      highlightCurrentWord(currentText);
    }
  };

  // Markeer einde van voorlezen
  fullUtterance.onend = () => {
    resumeIndex = fullSentences.length;
  };

  synth.speak(fullUtterance);
}

// Markeert het huidige voorgelezen woord
function highlightCurrentWord(currentText) {
  const fullText = textEl.innerText;
  const words = fullText.split(/\s+/);
  const currentWords = currentText.trim().split(/\s+/);
  const currentWord = currentWords[currentWords.length - 1];

  let highlightedHTML = words
    .map((w, i) =>
      w === currentWord && i === currentWords.length - 1
        ? `<span class="highlight">${w}</span>`
        : w
    )
    .join(" ");

  textEl.innerHTML = highlightedHTML;
  lastSentence = getLastSentence(currentText);
}

// Stop het voorlezen
function stopText() {
  if (synth.speaking) synth.cancel();
  const highlighted = document.querySelector("#text .highlight");
  if (highlighted) {
    const highlightText = highlighted.innerText;
    for (let i = 0; i < fullSentences.length; i++) {
      if (fullSentences[i].includes(highlightText)) {
        resumeIndex = i;
        break;
      }
    }
  }
}

// Haalt de laatste zin uit de tekst
function getLastSentence(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  return sentences ? sentences[sentences.length - 1].trim() : text;
}

// Eventlisteners voor start en stop knoppen
startReadingBtn.addEventListener("click", speakText);
stopReadingBtn?.addEventListener("click", stopText);

// Notitie aanmaken bij klikken op notitieknop
makeNoteBtn.addEventListener("click", () => {
  if (synth.speaking) synth.cancel();
  noteSentenceEl.textContent = `Note on: "${lastSentence}"`;
  noteInput.value = "";
  noteDialog.showModal();
});

// Spraakherkenning voor microfoonknop
micBtn?.addEventListener("click", () => {
  const recognition = new (window.SpeechRecognition ||
    window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.start();

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    noteInput.value = speechText;
  };
});

// Notitie opslaan
saveNoteBtn.addEventListener("click", () => {
  const note = {
    sentence: lastSentence,
    content: noteInput.value,
  };
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
  savedNotes.push(note);
  localStorage.setItem("notes", JSON.stringify(savedNotes));
  renderNotes();
  noteDialog.close();
});

// Notitie annuleren
document
  .getElementById("cancel-note")
  .addEventListener("click", () => noteDialog.close());

// Notities weergeven op de pagina
function renderNotes() {
  notesList.innerHTML = "";
  const savedNotes = JSON.parse(localStorage.getItem("notes")) || [];
  savedNotes.forEach((note) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${note.sentence}</strong><br>${note.content}`;
    notesList.appendChild(li);
  });
}

// Notities laden bij pagina-initialisatie
renderNotes();

// Functie om tekst van gefocuste elementen voor te lezen
function speakFocusedElementText(e) {
  if (synth.speaking) synth.cancel();
  let label =
    e.target.innerText ||
    e.target.value ||
    e.target.getAttribute("aria-label") ||
    e.target.getAttribute("alt");
  if (label) {
    const focusUtterance = new SpeechSynthesisUtterance(label);
    focusUtterance.rate = speechSpeed;
    synth.speak(focusUtterance);
  }
}

// Focus eventlisteners voor toegankelijkheid
document.querySelectorAll("button, h1, h2, #reader, #notes").forEach((el) => {
  el.addEventListener("focus", speakFocusedElementText);
});

// Instellingen handlers
// Lettergrootte aanpassen
fontSizeSelect?.addEventListener("change", (e) => {
  const size = e.target.value;
  document.body.style.fontSize = size;
  localStorage.setItem("fontSize", size);
});

// Lettergewicht aanpassen
fontWeightSelect?.addEventListener("change", (e) => {
  const weight = e.target.value;
  document.body.style.fontWeight = weight;
  localStorage.setItem("fontWeight", weight);
});

// Spreeksnelheid aanpassen
speechSpeedSelect?.addEventListener("change", (e) => {
  speechSpeed = parseFloat(e.target.value);
  localStorage.setItem("speechSpeed", speechSpeed);
});

// Stem selecteren
voiceSelect?.addEventListener("change", (e) => {
  selectedVoiceURI = e.target.value;
  localStorage.setItem("selectedVoiceURI", selectedVoiceURI);
});

// Instellingen resetten naar standaardwaarden
resetSettingsBtn?.addEventListener("click", () => {
  document.body.style.fontSize = "20px";
  document.body.style.fontWeight = "normal";
  fontSizeSelect.value = "20px";
  fontWeightSelect.value = "normal";
  speechSpeedSelect.value = "1";
  voiceSelect.selectedIndex = 0;

  speechSpeed = 1;
  selectedVoiceURI = "";

  localStorage.removeItem("fontSize");
  localStorage.removeItem("fontWeight");
  localStorage.removeItem("speechSpeed");
  localStorage.removeItem("selectedVoiceURI");
});

// Instellingenpaneel in/uitklappen
toggleSettingsBtn?.addEventListener("click", () => {
  const isOpen = settingsPanel.classList.toggle("open");

  // Tabindex beheren voor toegankelijkheid
  const focusableElements = settingsPanel.querySelectorAll("select, button");
  focusableElements.forEach((el) => {
    if (isOpen) {
      el.setAttribute("tabindex", "0");
    } else {
      el.setAttribute("tabindex", "-1");
    }
  });

  // Focus binnen het instellingenpaneel houden
  if (isOpen) {
    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];

    settingsPanel.addEventListener("keydown", trapFocus);
    first.focus();

    function trapFocus(e) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === "Escape") {
        toggleSettingsBtn.click();
      }
      if (!settingsPanel.classList.contains("open")) {
        settingsPanel.removeEventListener("keydown", trapFocus);
      }
    }
  }
});

// Opgeslagen instellingen herstellen
const savedFontSize = localStorage.getItem("fontSize");
if (savedFontSize) {
  document.body.style.fontSize = savedFontSize;
  fontSizeSelect.value = savedFontSize;
}

const savedFontWeight = localStorage.getItem("fontWeight");
if (savedFontWeight) {
  document.body.style.fontWeight = savedFontWeight;
  fontWeightSelect.value = savedFontWeight;
}

const savedSpeechSpeed = localStorage.getItem("speechSpeed");
if (savedSpeechSpeed) {
  speechSpeed = parseFloat(savedSpeechSpeed);
  speechSpeedSelect.value = savedSpeechSpeed;
}

if (selectedVoiceURI) {
  voiceSelect.value = selectedVoiceURI;
}

// Stemmen initialiseren
populateVoices();
