// variable to hold an instance of the p5.webserial library:
const serial = new p5.WebSerial();

// 全局变量来存储距离传感器的读数
let distance = 0;
//跟踪是否已经由距离传感器触发过一次
let triggeredByDistanceSensor = false;

// HTML button object:
let portButton;
let inData; // for incoming serial data
let outByte = 0; // for outgoing data

let delayStarted = false;
let delayTime = 2000; // 延时时间（毫秒）
let delayEndTime = 0; // 延时结束的时间

let showQuestions = false; // 控制是否显示问题

let showLoading = false; // 控制是否显示 loading
let loadingStartTime = 0; // loading 开始的时间
let loadingDuration = 5000; // loading 持续时间（毫秒）
let loadingText = ""; // loading 文本
let allowLoading = true; // 默认允许 loading

let sentSignal = false;

let currentQuestionIndex = 0; // 当前问题索引
const questions = [
  "Please take a site and put on the headset. You can push the button in front of you",
  "In the next few minutes,you will answer a few question, just speak directly, and I will listen",
  "Do you think your self is unique and certain?",
  "How would you describe yourself?",
  "How do you typically interact with your friends? Are you the planner, the peacemaker, or the go-to for advice? Or you enjoy your solitude and don't have many close friends",
  "If you were to describe your inner self as a house, what would it be like? What do you see? Is it night or day? What season is it? Where does the light come in from?",
  "Is there another you hidden inside your body?",
  "What kind of person is he/she specifically? How does he/she treat people?  How does he/she view the world?",
  "If you had to open a room in such a house just for your other self, where would that be?",
  "What would he/she be doing there?",
];

let recording = false;
let recorder;
let chunks = [];
let capture;
let video;
let isVideoPlaying = false;
const fr = 30;

// 在全局范围内声明输入框和按钮
let inputBox;
// let sendButton;
let userInputs = []; // 存储用户输入的内容

function setup() {
  createCanvas(windowWidth, windowHeight);
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
  inputBox.position(30, height - 150);
  inputBox.style("width", "400px"); // 增加输入框的宽度
  inputBox.style("height", "60px"); // 增加输入框的高度
  inputBox.style("font-size", "24px"); // 可选：增加字体大小以改善可读性

  //   sendButton = createButton('Send');
  //   sendButton.position(inputBox.x + inputBox.width, height - 40);
  //   sendButton.mousePressed(sendInput);
  //     sendButton.style('width', '100px'); // 增加按钮的宽度
  //   sendButton.style('height', '60px'); // 增加按钮的高度
  //   sendButton.style('font-size', '24px'); // 增加字体大小
}

function draw() {
  background(0);
  textFont("Courier New");
  // 当达到特定问题时显示输入框和发送按钮
  if (currentQuestionIndex >= 2 && showQuestions) {
    // 第三个问题的索引为 2
    inputBox.show();
    // sendButton.show();
  } else {
    inputBox.hide();
    // sendButton.hide();
  }

  // 当距离sensor trigged并且延时结束后，显示第一个文本
  if (delayStarted && millis() >= delayEndTime) {
    if (showQuestions) {
      fill(255);
      textSize(42);
      let textWidth = windowWidth - 40;
      let textHeight = windowHeight / 2 - 50;
      let textX = 30;
      let textY = windowHeight / 2 - 50;
      text(
        questions[currentQuestionIndex],
        30,
        windowHeight / 2 - 50,
        windowWidth - 40,
        windowHeight / 2 - 50
      );
    } else if (showLoading) {
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
    } else if (
      !showQuestions &&
      !showLoading &&
      currentQuestionIndex >= questions.length - 1
    ) {
      textSize(80);
      text(
        "Ok, Let's talk.",
        30,
        windowHeight / 2 - 50,
        windowWidth - 40,
        windowHeight / 2 - 50
      );
      if (!sentSignal) {
        serial.write("All Set");
        sentSignal = true; // 防止重复发送信号
        allowLoading = false; // 禁止再次进入 loading
        //延迟视频出现
        setTimeout(() => {
          recorder.stop();
        }, 2000); // 延迟3000毫秒（3秒）

        console.log("recording stopped!");
      }
    }
  }
}

// if there's no port selected,
// make a port select button appear:
function makePortButton() {
  // create and position a port chooser button:
  portButton = createButton("choose port");
  portButton.position(10, 10);
  // give the port button a mousepressed handler:
  portButton.mousePressed(choosePort);
}

// make the port selector window appear:
function choosePort() {
  if (portButton) portButton.show();
  serial.requestPort();
}

// open the selected port, and make the port
// button invisible:
function openPort() {
  // wait for the serial.open promise to return,
  // then call the initiateSerial function
  serial.open().then(initiateSerial);

  // once the port opens, let the user know:
  function initiateSerial() {
    console.log("port open");
  }
  // hide the port button once a port is chosen:
  if (portButton) portButton.hide();
}

// pop up an alert if there's a port error:
function portError(err) {
  alert("Serial port error: " + err);
}

// try to connect if a new serial port
// gets added (i.e. plugged in via USB):
function portConnect() {
  console.log("port connected");
  serial.getPorts();
}

// if a port is disconnected:
function portDisconnect() {
  serial.close();
  console.log("port disconnected");
}

function closePort() {
  serial.close();
}

function serialEvent() {
  let incomingData = serial.readStringUntil("\n");
  // console.log("Received data: ", incomingData); // 打印接收到的数据
  if (incomingData !== null && incomingData.length > 0) {
    if (incomingData.startsWith("D:")) {
      let distanceStr = incomingData.substring(2).trim();
      let parsedDistance = parseInt(distanceStr);
      if (!isNaN(parsedDistance)) {
        distance = parsedDistance;
        // console.log("D" + distance);
        // 当没有问题正在显示且是第一个问题时，才由距离传感器触发问题显示
        if (distance < 50 && !showQuestions && currentQuestionIndex === 0) {
          showQuestions = true;
          delayStarted = true;
          delayEndTime = millis() + delayTime;
          record();
        }
      }
    } else if (incomingData.trim() === "B:1") {
      // 按钮用于切换问题，仅在问题显示后有效
      let buttonState = incomingData.trim();
      // console.log(buttonState);
      if (currentQuestionIndex >= 2) {
        // 按下button
        sendInput();
      }
      if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        showQuestions = true;
      } else if (
        currentQuestionIndex == questions.length - 1 &&
        !showLoading &&
        allowLoading
      ) {
        // 当所有问题都已显示，且允许 loading 时，才触发 loading
        showQuestions = false;
        showLoading = true;
        loadingStartTime = millis();
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
    showLoading = false; // 结束 loading，显示最终文本
  }
}

function record() {
  if (video) {
    video.remove();
    video = null;
  }
  chunks.length = 0;
  let stream = capture.elt.srcObject;
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => {
    if (e.data.size) {
      chunks.push(e.data);
    }
  };
  recorder.onstop = exportVideo;
  isVideoPlaying = false;
  recording = true;
  recorder.start();
  console.log("recording started!");
}

function exportVideo(e) {
  recording = false;
  var blob = new Blob(chunks, { type: "video/webm" });
  video = createVideo(URL.createObjectURL(blob), videoLoaded);
}

function videoLoaded() {
  video.loop();
  video.volume(0);
  // 设置视频大小为竖屏比例
  let captureHeight = windowHeight;
  let captureWidth = (captureHeight * 3) / 4; // 确保这里是竖屏比例，比如3:4
  video.size(captureWidth, captureHeight);

  // 设置延迟播放
  //   setTimeout(() => {
  //     video.play();
  //     isVideoPlaying = true;
  //   }, 10000);  // 延迟3000毫秒（3秒）

  // 设置视频在画布下方居中播放
  video.position((windowWidth - video.width) / 2, windowHeight - video.height);
}

// function keyPressed() {
//   if (keyCode === 82) {
//     if (recording) {
//       recorder.stop();
//       console.log("recording stopped!");
//     } else {
//       record();
//     }
//   }
// }

function sendInput() {
  let userInput = inputBox.value();
  console.log("User input: " + userInput);
  userInputs.push(userInput); // 将输入内容添加到数组中

  // 清空输入框
  inputBox.value("");

  // 可以在这里添加将输入内容发送给 GPT 的代码?
  // sendToGPT(userInputs);
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
