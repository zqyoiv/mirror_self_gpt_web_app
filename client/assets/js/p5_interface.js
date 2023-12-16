// ========================================================
//  Contents:
//  1. p5 Canvas drawing functions.
//  2. HTML event handlers
//  3. Debug
//
// original version: https://editor.p5js.org/qh2207/sketches/5SfuOIngg
// ========================================================

const serial = new p5.WebSerial();

let distance = 0;
let triggeredByDistanceSensor = false;

// HTML button object:
let portButton;
let inData; // for incoming serial data
let outByte = 0; // for outgoing data

let delayStarted = false;
let delayTime = 2000; // 延时时间（毫秒）
let delayEndTime = 0; // 延时结束的时间

let sentSignal = false;

let chunks = [];
let capture;
const fr = 30;

let loadingDuration = 5000;
let loadingText = "";
let loadingStartTime = 0;

// let sendButton;
let userInputs = []; // 存储用户输入的内容

let questionDisplayer = new QuestionDisplayer();
let storyboardController = new StoryboardController();
let wordCircle = new WordCircle();

// ========================================================
//     1. p5 Canvas drawing functions.
// ========================================================

function preload() {
  preloadAudio();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(255);
  textStyle(NORMAL);

  // check to see if serial is available:
  if (!navigator.serial) {
    alert("WebSerial is not supported in this browser. Try Chrome or MS Edge.");
  }
  // if serial is av  ailable, add connect/disconnect listeners:
  navigator.serial.addEventListener("connect", portConnect);
  navigator.serial.addEventListener("disconnect", portDisconnect);
  // check for any ports that are available:
  serial.getPorts();
  // if there's no port chosen, choose one:
  serial.on("noport", makePortButton);
  // open whatever port is available:
  serial.on("portavailable", openPort);
  // handle serial errors:
  serial.on("requesterror", portError);
  // handle any incoming serial data:
  serial.on("data", serialEvent);
  serial.on("close", makePortButton);

  serial.write("All Set");

  //输入框
  inputBox = createInput("");
  inputBox.id("answer-input");
  inputBox.position(30, windowHeight / 2 + 100);
  inputBox.style("width", "600"); // 增加输入框的宽度
  inputBox.style("height", "100"); // 增加输入框的高度
  inputBox.style("font-size", "24px"); // 可选：增加字体大小以改善可读性

  // Bind input element with speech recognition result.
  speechRecognition = speechRecognitionSetup(inputBox.elt);

  storyboardController.state = INSTRUCTION_STATE;
  // storyboardController.state = MIRROR_STATE;
  wordCircle.setup("This is a paragraph that will be displayed in a circle. Each character will disappear one by one over a period of 3 minutes.");

  questionDisplayer.displayInstruction(storyboardController.instructionNumber);
  inputBox.hide();
  storyboardController.nextInstruction();
}

function draw() {
    if (storyboardController.state == LOADING_STATE) {
        // need to be here bc mirror state keep redraw canvas
        background(255);
        fill(0);
        text(
            loadingText,
            30,
            windowHeight / 2 - 180,
            windowWidth - 40,
            windowHeight / 2 - 150
        );
        loadingStateButtonSetup();
        updateLoadingText();
    } else if (storyboardController.state == MIRROR_STATE) {        
        wordCircle.draw();
        if (!IS_AUDIO_MODE) {
          inputBox.show();
        }
    } else if (storyboardController.state == END_STATE) {
      removeAllSpeechFiles();
      location.reload();
    }
}

function updateLoadingText() {
  let currentTime = millis();
  let loadingEllipses = Math.floor((currentTime - loadingStartTime) / 500) % 7;
  textSize(100);
  loadingText = ".".repeat(loadingEllipses);
}

// ========================================================
//     2. HTML event handlers
// ========================================================

window.onload = function() {
  // Reload the visual app when mirror self application is reloaded.
  resetMirrorVisual();
};

document.addEventListener('DOMContentLoaded', () => {
  // Audio record button
  $("video#recording-label")[0].style.display = "none";
  $("video#recording-label-black")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("img#submit-button-black")[0].style.display = "none";

  $("video#recording-label").on("click", function() {
    // console.log("recording-label clicked");
    isRecognitionStarted = !isRecognitionStarted;
    if (isRecognitionStarted) {
      if (storyboardController.questionNumber == 1) {
        displayClickTwoMessage();
      }
      $("video#recording-label")[0].play();
      speechRecognition.start();
    } else {
      $("video#recording-label")[0].pause();
      $("video#recording-label")[0].currentTime = 0;
      speechRecognition.stop();   
    }
  });

  $("video#recording-label-black").on("click", function() {
    isRecognitionStarted = !isRecognitionStarted;
    if (isRecognitionStarted) {
      $("video#recording-label-black")[0].play();
      speechRecognition.start();
    } else {
      $("video#recording-label-black")[0].pause();
      $("video#recording-label-black")[0].currentTime = 0;
      speechRecognition.stop();
    }
  });

  // Next button
  $("img#next-button").on("mousedown", function() {
    pushButtonNextStepHandler();
  });
}, false);

// ========================================================
//     3. Debug
// ========================================================

// Debug workflow, simulate button pushing.
function keyPressed() {
  if (key === '1') {
    inputBox.value = "yes";
    speechResult = "yes";
    pushButtonNextStepHandler();
  }
  // for more answer questions.
  else if (key === '2') {
    inputBox.value = "yes yes yes yes yes";
    speechResult = "yes yes yes yes yes";
    pushButtonNextStepHandler();
  }
}