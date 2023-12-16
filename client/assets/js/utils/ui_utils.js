// ========================================================
//  Contents:
//  1. UI Display
//  2. UI State Handlers
//  3. Speech recognition
// ========================================================
let speechRecognition;
let recordingButton;
let isRecognitionStarted = false;
let isSpeechReadyToSubmit = false;
let speechResult;

let inputBox;

const CHECK_MARK_TIMER = 1000;
// ========================================================
//      1. UI Display
// ========================================================

// ============= set up icons =====================

function questionStateButtonSetup() {
  $("img#next-button")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("img#submit-button-black")[0].style.display = "none";
  $("video#recording-label-black")[0].style.display = "none";

  $("video#recording-label")[0].style.display = "block";
}

function mirrorStateButtonSetup() {
  inputBox.hide();
  $("img#next-button")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("img#submit-button-black")[0].style.display = "none";
  $("video#recording-label")[0].style.display = "none";

  $("video#recording-label-black")[0].style.display = "block";
}

function loadingStateButtonSetup() {
  inputBox.hide();
  $("img#next-button")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("img#submit-button-black")[0].style.display = "none";
  $("video#recording-label")[0].style.display = "none";
  $("video#recording-label-black")[0].style.display = "none";
}

// =============== msg display ========================

function displayClickOneMessage() {
  $('div.info-display').attr("id", "");
  $('div.info-display').text("Tap the button to start recording.");
}

function displayClickTwoMessage() {
  $('div.info-display').attr("id", "");
  $('div.info-display').text("Tap the button again to stop recording.");
}

function displaySaySomethingMessage() {
  // console.log("say sth msg");
  $('div.info-display').attr("id", "error");
  $('div.info-display').text("Please say something.");
}

function displayShareMoreMessage() {
  // console.log("share more msg");
  $('div.info-display').attr("id", "error");
  $('div.info-display').text("Would you mind sharing more？");
}

function clearInfoDisplay() {
  $('div.info-display').attr("id", "");
  $('div.info-display').text("");
}

// ================= redraw ========================

function redrawBackgroundAndSetTextConfig() {
  background(255);
  fill(60);
}

// ========================================================
//      2. UI State Handlers
// ========================================================

function pushButtonNextStepHandler() {
  if (storyboardController.state == INSTRUCTION_STATE) {
      if (storyboardController.instructionNumber == 1) {
        // first time click next button, start recording video.
        sendStartRecordRequest();
      }
      questionDisplayer.displayInstruction(storyboardController.instructionNumber);
      inputBox.hide();
      storyboardController.nextInstruction();
  } else if (storyboardController.state == QUESTION_STATE) {
    handleQuestionStateSubmit();
  } else if (storyboardController.state == MIRROR_STATE) {
    handleMirrorStateSubmit();
  }
}

function handleMirrorStateSubmit() {
    let answer = speechResult;
    
    // When type less than 3 words, show error message.
    if (answer == "" || ((storyboardController.questionNumber != 6) 
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
        inputBox.value = "";
    }
}

// 1. Send the user answer to the current question to server.
// 2. Display next question.
function handleQuestionStateSubmit() {
  questionStateButtonSetup();
  let answer = speechResult;
  let currentQuestionIndex = storyboardController.questionNumber;
  let lastQuestionIndex = currentQuestionIndex - 1;
  if (IS_AUDIO_MODE) {
    $("video#recording-label")[0].style.display = "block";
  } else {
    inputBox.show();
  }

  if (currentQuestionIndex == 0) {
      displayClickOneMessage();
      questionDisplayer.displayQuestion(storyboardController.questionNumber);
      storyboardController.nextQuestion();
      inputBox.value = "";
  } else if (currentQuestionIndex > 0) {
    clearInfoDisplay();
    if (answer == "") {
        // Block user from submitting empty answer.
        questionDisplayer.displayQuestion(lastQuestionIndex);
        displaySaySomethingMessage();
        return;
    }
    // For these questions, block user when they say less than 5 words.
    else if ([2, 3, 7, 8, 9].includes(lastQuestionIndex)) {
      if (answer.split(" ").length < 5) {
        // Block user from submitting empty answer.
        questionDisplayer.displayQuestion(lastQuestionIndex);
        displayShareMoreMessage();
        return;
      }
    }

    // Send last question's answer to GPT
    sendAnswerToServer(answer, lastQuestionIndex, storyboardController);
    inputBox.value = "";

    if (lastQuestionIndex == 6) {
      if (answer.indexOf("es") != -1) {
        storyboardController.isQuestion6Yes = true;
        storyboardController.questionNumber = 7;
        currentQuestionIndex = storyboardController.questionNumber;
        questionDisplayer.displayQuestion(currentQuestionIndex);
        inputBox.value = "";
      } else {
        storyboardController.isQuestion6Yes = false;
        storyboardController.questionNumber = 8;
        currentQuestionIndex = storyboardController.questionNumber;
        questionDisplayer.displayQuestion(currentQuestionIndex);
        inputBox.value = "";
        // console.log("---- updates isQuestion6Yes: false");
      }
    } else {
      questionDisplayer.displayQuestion(currentQuestionIndex);
      inputBox.value = "";
    }

    // Play audio.
    if (lastQuestionIndex == 4) {
      playDayNightMusicFromText(answer);
    } else if (lastQuestionIndex == 5) {
      playSeasonMusicFromText(answer);
    }

    if (currentQuestionIndex == 10) {
      storyboardController.nextState();
    } else {
      storyboardController.nextQuestion(); 
    }
    
    loadingStartTime = millis();
    
  }               
}

// ========================================================
//     3. Speech recognition.
// ========================================================

function speechRecognitionSetup(inputBox) {
  if ("webkitSpeechRecognition" in window) {
    // Speech Recognition Stuff goes here
    speechRecognition = new webkitSpeechRecognition();
    speechRecognition.continuous = true;
    speechRecognition.lang = "en-US";
    // Whether to return interim results (results that are not yet final)
    speechRecognition.interimResults = true;

    speechRecognition.onstart = function() {
      speechResult = "";
      inputBox.value = "";
      if (storyboardController.questionNumber > 1) {
        clearInfoDisplay();
      }
    };

    speechRecognition.onend = function() {
      isRecognitionStarted = false;
      isSpeechReadyToSubmit = speechResult !== "" ? true : false;
      if (isSpeechReadyToSubmit) {
        if (storyboardController.state == QUESTION_STATE) {
          $("video#recording-label")[0].style.display = "none";
          $("img#submit-button")[0].style.display = "block";
          sleep(CHECK_MARK_TIMER).then(() => {
            pushButtonNextStepHandler();
          });
        } else if (storyboardController.state == MIRROR_STATE) {
          $("video#recording-label-black")[0].style.display = "none";
          $("img#submit-button-black")[0].style.display = "block";
          sleep(CHECK_MARK_TIMER).then(() => {
            pushButtonNextStepHandler();
          });
        }
      } else {
        displaySaySomethingMessage();
      }
    };

    speechRecognition.onresult = function(event) {
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          var transcript = event.results[i][0].transcript;
          inputBox.value = inputBox.value + " " + transcript;
          inputBox.textContent = inputBox.value;
          console.log('Final result: ' + transcript);
        }
      }
      console.log('result: ' + inputBox.value);
      speechResult = inputBox.value;
    };
    return speechRecognition;
  }
}
