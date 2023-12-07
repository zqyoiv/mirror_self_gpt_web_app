// original version: https://editor.p5js.org/qh2207/sketches/5SfuOIngg
const serial = new p5.WebSerial();
let speechRecognition;

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

function preload() {
  preloadAudio();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  textFont("Courier New");

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
  questionDisplayer.displayInstruction(storyboardController.instructionNumber);
  inputBox.hide();
  storyboardController.nextInstruction();
  
  speechRecognition.start();
}

function draw() {
    if (storyboardController.state == LOADING_STATE) {
        background(0);
        fill(255);
        textSize(24);
        text(
            loadingText,
            30,
            windowHeight / 2 - 50,
            windowWidth - 40,
            windowHeight / 2 - 50
        );
        inputBox.hide();
        updateLoadingText();
    } else if (storyboardController.state == MIRROR_STATE) {
        mirrorSelfDisplayer.display();
        inputBox.show();
        let countDownTimer = storyboardController.mirrorCountDowntext();
        fill('red');
        text(countDownTimer, 30, 50);
    } else if (storyboardController.state == END_STATE) {
      location.reload();
    }
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

function pushButtonNextStepHandler() {
  background(0);
    if (storyboardController.state == INSTRUCTION_STATE) {
        questionDisplayer.displayInstruction(storyboardController.instructionNumber);
        inputBox.hide();
        storyboardController.nextInstruction();
    } else if (storyboardController.state == QUESTION_STATE) {
      handleQuestionStateSubmit();
    } else if (storyboardController.state == MIRROR_STATE) {
      handleMirrorStateSubmit();
    }
}

function updateLoadingText() {
  let currentTime = millis();
  let loadingEllipses = Math.floor((currentTime - loadingStartTime) / 500) % 7;
  textSize(100);
  loadingText = ".".repeat(loadingEllipses);
  if (currentTime - loadingStartTime > loadingDuration) {
    serial.write("All Set");
    console.log("--------------------- All set sent ----------------------");
    storyboardController.nextState();
  }
}

function handleMirrorStateSubmit() {
    let answer = inputBox.value();
    mirrorSelfDisplayer.display();
    
    // When type less than 3 words, show error message.
    if (answer == "" || ((storyboardController.questionNumber != 5) 
                        && (storyboardController.questionNumber != 0) 
                        && answer.split(" ") >= 3)) {
        fill("red");
        text("Mind sharing a bit more?", 30, 50);
    } else {
        chatWithMirrorSelf(answer, (response) => {
            redrawBackgroundAndSetTextConfig();
            text(responseText,
            30,
            windowHeight / 2 - 50,
            windowWidth - 40,
            windowHeight / 2 - 50);
        });
        inputBox.value("");
    }
}

// 1. Send the user answer to the current question to server.
// 2. Display next question.

function handleQuestionStateSubmit() {
    let answer = inputBox.value();
    let currentQuestionIndex = storyboardController.questionNumber;
    let lastQuestionIndex = currentQuestionIndex - 1;
    inputBox.show();

    if (currentQuestionIndex == 0) {
        questionDisplayer.displayQuestion(storyboardController.questionNumber);
        storyboardController.nextQuestion();
    } else if (currentQuestionIndex > 0) {
      if (answer == "") {
        // Block user from submitting empty answer.
        questionDisplayer.displayQuestion(lastQuestionIndex);
        fill("red");
        text("Please say something.", 30, 50);
      } else {
        // Send last question's answer to GPT
        sendAnswerToServer(answer, lastQuestionIndex, storyboardController);
        inputBox.value("");

        if (lastQuestionIndex == 5) {
          if (answer.indexOf("es") != -1) {
            storyboardController.isQuestion6Yes = true;
            storyboardController.questionNumber = 6;
            currentQuestionIndex = storyboardController.questionNumber;
            questionDisplayer.displayQuestion(currentQuestionIndex);
          } else {
            storyboardController.isQuestion6Yes = false;
            storyboardController.questionNumber = 7;
            currentQuestionIndex = storyboardController.questionNumber;
            questionDisplayer.displayQuestion(currentQuestionIndex);
            console.log("---- updates isQuestion6Yes: false");
          }
        } else {
          questionDisplayer.displayQuestion(currentQuestionIndex);
        }

        // Play audio.
        if (lastQuestionIndex == 3) {
          playDayNightMusicFromText(answer);
        } else if (lastQuestionIndex == 4) {
          playSeasonMusicFromText(answer);
        }

        if (currentQuestionIndex == 9) {
          storyboardController.nextState();
        } else {
          storyboardController.nextQuestion(); 
        }
        
        loadingStartTime = millis();
      }
  }               
}

function redrawBackgroundAndSetTextConfig() {
  background(0);
  fill(255);
  textSize(42);
}