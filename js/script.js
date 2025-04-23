const fontSizeInput = document.querySelector("#font-size");
const settings = document.querySelector(".settings");
const openSettingsButton = document.querySelector(".settings-button");
const startReadingButton = document.querySelector(".start-reading-button");
const paragraphs = document.querySelectorAll("#your-books p");
let openSettings = false;
let currentPath = location.pathname;

openSettingsButton.addEventListener("click", () => {
  if (!openSettings) {
    openSettings = true;
    settings.classList.add("open");
  } else {
    openSettings = false;
    settings.classList.remove("open");
  }
});

fontSizeInput.addEventListener("input", () => {
  console.log(fontSizeInput.value);
});

function textToSpeech(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;
  speechSynthesis.speak(utterance);
}

setInterval(() => {
  currentPath = location.pathname;
});

if (currentPath.includes("/your-books"))
  startReadingButton.addEventListener("click", () => {
    paragraphs.forEach((paragraph, index) => {
      setTimeout(() => {
        textToSpeech(paragraph.textContent);
      }, index * 2000);
    });
  });

if (!currentPath.includes("/your-books")) {
}

document.addEventListener("keydown", (e) => {
  if (e.key === " ") {
    console.log("Space key pressed");
    speechSynthesis.cancel();
  }
});
