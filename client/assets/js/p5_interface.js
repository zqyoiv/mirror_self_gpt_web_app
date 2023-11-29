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

let recording = false;
let recorder;
let chunks = [];
let capture;
let video;
let isVideoPlaying = false;
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

  //WebCam捕捉视频
  // let cnv = createCanvas(windowWidth, windowHeight); // 设置画布为全屏
  // cnv.style('display', 'block'); // 确保画布没有额外的边距
  capture = createCapture(VIDEO, function () {
    // 根据3:4的竖屏格式设置视频尺寸
    let captureHeight = windowHeight; // 视频高度与画布高度一致
    let captureWidth = (captureHeight * 3) / 4; // 视频宽度为高度的3/4
    capture.size(captureWidth, captureHeight);
    capture.hide();
  });

  //输入框
  inputBox = createInput("");
  inputBox.id("answer-input");
  inputBox.position(30, height - 150);
  inputBox.style("width", "400px"); // 增加输入框的宽度
  inputBox.style("height", "40px"); // 增加输入框的高度
  inputBox.style("font-size", "24px"); // 可选：增加字体大小以改善可读性
  inputBox.hide();
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
        updateLoadingText();
    } else if (storyboardController.state == MIRROR_STATE) {
        mirrorSelfDisplayer.display();
        inputBox.show();
    }
}
function serialEvent() {
    let incomingData = serial.readStringUntil("\n");
    if (incomingData !== null && incomingData.length > 0) {
      // Distance sensor
      if (incomingData.startsWith("D:")) {
        let distanceStr = incomingData.substring(2).trim();
        let parsedDistance = parseInt(distanceStr);
        if (!isNaN(parsedDistance)) {
          distance = parsedDistance;
          // console.log("D" + distance);
          // 当没有问题正在显示且是第一个问题时，才由距离传感器触发问题显示
          if (distance < 50 
            && storyboardController.state == -1) {
            storyboardController.state = QUESTION_STATE;
            background(0);
            questionDisplayer.displayInstruction(0);
            inputBox.hide();

            delayStarted = true;
            delayEndTime = millis() + delayTime;
            record();
          }
        }
        // Button (guide --> question --> mirror)
      } else if (incomingData.trim() === "B:1") {
        if (storyboardController.state == QUESTION_STATE) {
            handleQuestionStateSubmit();
        }
        if (storyboardController.state == MIRROR_STATE) {
            handleMirrorStateSubmit();
        }
      }
    }
}

function updateLoadingText() {
  let currentTime = millis();
  let loadingEllipses = Math.floor((currentTime - loadingStartTime) / 500) % 7;
  textSize(100);
  loadingText = ".".repeat(loadingEllipses);
  if (currentTime - loadingStartTime > loadingDuration) {
    serial.write("All Set");
    setTimeout(() => {
        recorder.stop();
    }, 2000);
    storyboardController.nextState();
  }
}

function handleMirrorStateSubmit() {
    let answer = inputBox.value();
    mirrorSelfDisplayer.display();
    
    if (answer == "") {
        fill("red");
        text("Please say something.", 30, 50);
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

function handleQuestionStateSubmit() {
    let answer = inputBox.value();
    let currentQuestionIndex = storyboardController.questionNumber;
    inputBox.show();

    if (currentQuestionIndex == 0) {
        questionDisplayer.displayQuestion(currentQuestionIndex);
        storyboardController.nextQuestion();  
    }
    if (currentQuestionIndex > 0) {
        if (answer == "") {
            fill("red");
            text("Please say something.", 30, 50);
        } else {
            // Send last question's answer to GPT
            sendAnswerToServer(answer, currentQuestionIndex - 1);
            inputBox.value("");
            questionDisplayer.displayQuestion(currentQuestionIndex);
            storyboardController.nextQuestion(); 
            loadingStartTime = millis();
        }
    }               
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 如果视频正在播放，调整其大小和位置以保持竖屏比例
  if (isVideoPlaying) {
    let captureHeight = windowHeight;
    let captureWidth = (captureHeight * 1) / 4; // 同上，保持竖屏比例
    video.size(captureWidth, captureHeight);
    video.position(
      (windowWidth - video.width) / 2,
      windowHeight - video.height
    );
  }
}
