// original version: https://editor.p5js.org/qh2207/sketches/5SfuOIngg
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

// 在全局范围内声明输入框和按钮
let inputBox;
// let sendButton;
let userInputs = []; // 存储用户输入的内容

let mirrorSelfDisplayer = new MirrorSelfDisplayer();
let questionDisplayer = new QuestionDisplayer();
let storyboardController = new StoryboardController();
let wordCircle = new WordCircle();

function preload() {
  preloadAudio();
}

function setup() {
  let canvasWidth = windowWidth;
  let canvasHeight = (canvasWidth / 4) * 3;
  createCanvas(canvasWidth, canvasHeight);
  background(255);
  // textFont("Courier New")
  textFont("Open Sans");
  textStyle(BOLD);

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

document.addEventListener('DOMContentLoaded', () => {
  // Audio record button
  $("video#recording-label")[0].style.display = "none";
  $("video#recording-label-black")[0].style.display = "none";

  $("video#recording-label").on("mousedown", function() {
    isRecordButtonPressed = true;
    $("video#recording-label")[0].play();

    if (!isRecognitionStarted) {
      speechRecognition.start();
    }
  });
  $("video#recording-label-black").on("mousedown", function() {
    isRecordButtonPressed = true;
    $("video#recording-label-black")[0].play();

    if (!isRecognitionStarted) {
      speechRecognition.start();
    }
  });

  let allowMouseUp = true;
  let allowMouseUpBlack = true;
  $("video#recording-label").on("mouseup", function() {
    if (allowMouseUp) {
      isRecordButtonPressed = false;
      // Prevent calling mouseup multiple times.
      allowMouseUp = false;

      $("video#recording-label")[0].pause();
      $("video#recording-label")[0].currentTime = 0;
      speechRecognition.stop();
      // pushButtonNextStepHandler() is called in speechRecognition.onresult().

      setTimeout(() => {
        allowMouseUp = true;
      }, 300); // 300 milliseconds
    }
  });
  $("video#recording-label-black").on("mouseup", function() {
    if (allowMouseUpBlack) {
      isRecordButtonPressed = false;
      // Prevent calling mouseup multiple times.
      allowMouseUpBlack = false;

      $("video#recording-label-black")[0].pause();
      $("video#recording-label-black")[0].currentTime = 0;
      speechRecognition.stop();
      // pushButtonNextStepHandler() is called in speechRecognition.onresult().

      setTimeout(() => {
        allowMouseUpBlack = true;
      }, 300); // 300 milliseconds
    }
  });

  // Next button
  $("img#next-button").on("mousedown", function() {
    pushButtonNextStepHandler();
  });
}, false);

function draw() {
    if (storyboardController.state == LOADING_STATE) {
        $("video#recording-label")[0].style.display = "none";
        $("img#next-button")[0].style.display = "none";
        background(255);
        fill(0);
        text(
            loadingText,
            30,
            windowHeight / 2 - 180,
            windowWidth - 40,
            windowHeight / 2 - 150
        );
        inputBox.hide();
        updateLoadingText();
    } else if (storyboardController.state == MIRROR_STATE) {
        wordCircle.draw();

        $("video#recording-label")[0].style.display = "none";
        $("video#recording-label-black")[0].style.display = "block";

        // $("img#next-button")[0].style.display = "none";
        // mirrorSelfDisplayer.display();

        if (!IS_AUDIO_MODE) {
          inputBox.show();
        }

        // let countDownTimer = storyboardController.mirrorCountDowntext();
        // fill('red');
        // text(countDownTimer, 30, 50);
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

// Debug workflow, simulate button pushing.
function keyPressed() {
  if (key === '1') {
    pushButtonNextStepHandler();
  }
}

function serialEvent() {
    let incomingData = serial.readStringUntil("\n");
    if (incomingData !== null && incomingData.length > 0) {
        // Button (guide --> question --> mirror)
      if (incomingData.trim() === "B:1") {
        pushButtonNextStepHandler();
      }
    }
}