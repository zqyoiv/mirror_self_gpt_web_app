// ========================================================
//  Contents:
//  1. UI Control
//  2. Speech recognition
//  3. p5 drawing
// ========================================================

let speechRecognition;
let recordingButton;
let isRecognitionStarted = false;
let isSpeechReadyToSubmit = false;
let speechResult;

let inputBox;

// ========================================================
//      1. UI Control
// ========================================================

function questionStateButtonSetup() {
  $("img#next-button")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("video#recording-label-black")[0].style.display = "none";

  $("video#recording-label")[0].style.display = "block";
}

function mirrorStateButtonSetup() {
  inputBox.hide();
  $("img#next-button")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("video#recording-label")[0].style.display = "none";

  $("video#recording-label-black")[0].style.display = "block";
}

function loadingStateButtonSetup() {
  inputBox.hide();
  $("img#next-button")[0].style.display = "none";
  $("img#submit-button")[0].style.display = "none";
  $("video#recording-label")[0].style.display = "none";
  $("video#recording-label-black")[0].style.display = "none";
}

function pushButtonNextStepHandler() {
  background(255);
  $("video#recording-label")[0].style.display = "none";
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
    mirrorStateButtonSetup();

    let answer = inputBox.value();
    mirrorSelfDisplayer.display();
    
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
        inputBox.value("");
    }
}

// 1. Send the user answer to the current question to server.
// 2. Display next question.
function handleQuestionStateSubmit() {
  questionStateButtonSetup();
  let answer = inputBox.value();
  let currentQuestionIndex = storyboardController.questionNumber;
  let lastQuestionIndex = currentQuestionIndex - 1;
  if (IS_AUDIO_MODE) {
    $("video#recording-label")[0].style.display = "block";
  } else {
    inputBox.show();
  }

  if (currentQuestionIndex == 0) {
      questionDisplayer.displayQuestion(storyboardController.questionNumber);
      storyboardController.nextQuestion();
      inputBox.value("");
  } else if (currentQuestionIndex > 0) {
    if (answer == "") {
        // Block user from submitting empty answer.
        questionDisplayer.displayQuestion(lastQuestionIndex);
        displayInputMoreMessage();
    } else {
      // Send last question's answer to GPT
      sendAnswerToServer(answer, lastQuestionIndex, storyboardController);
      inputBox.value("");

      if (lastQuestionIndex == 6) {
        if (answer.indexOf("es") != -1) {
          storyboardController.isQuestion6Yes = true;
          storyboardController.questionNumber = 7;
          currentQuestionIndex = storyboardController.questionNumber;
          questionDisplayer.displayQuestion(currentQuestionIndex);
          inputBox.value("");
        } else {
          storyboardController.isQuestion6Yes = false;
          storyboardController.questionNumber = 8;
          currentQuestionIndex = storyboardController.questionNumber;
          questionDisplayer.displayQuestion(currentQuestionIndex);
          inputBox.value("");
          console.log("---- updates isQuestion6Yes: false");
        }
      } else {
        questionDisplayer.displayQuestion(currentQuestionIndex);
        inputBox.value("");
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
}
  
  function displayInputMoreMessage() {
    console.log("displayInputMoreMessage()");
    $('div.info-display').attr("id", "error");
    $('div.info-display').text("Please say something.");
  }

  // ========================================================
//     2. Speech recognition.
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
      isRecognitionStarted = true;
    };

    speechRecognition.onend = function() {
      isRecognitionStarted = false;
      isSpeechReadyToSubmit = speechResult !== "" ? true : false;
        if (isSpeechReadyToSubmit) {
          $("video#recording-label")[0].style.display = "none";
          $("img#submit-button")[0].style.display = "block";
          pushButtonNextStepHandler();
        } else {
          displayInputMoreMessage();
        }
    };

    speechRecognition.onresult = function(event) {
        for (var i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i]) {
                // Final transcript of the recognized speech
                var transcript = event.results[i][0].transcript;
                inputBox.value = inputBox.value + " " + transcript;
                inputBox.textContent = inputBox.value;
                console.log('Final result: ' + transcript);
            }
        }
        speechResult = inputBox.value;
    };

  } else {
    console.log("Speech Recognition Not Available");
  }
  return speechRecognition;
}

function removeAllSpeechFiles() {
  const fs = require('fs');
  const path = require('path');

  const directoryPath = 'path/to/your/directory';

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return;
    }

    files.forEach(file => {
      if (file.includes('speech')) {
        const filePath = path.join(directoryPath, file);
        fs.unlink(filePath, err => {
          if (err) {
            console.error('Error deleting file:', err);
          } else {
            console.log(`Deleted file: ${filePath}`);
          }
        });
      }
    });
  });
}

// ========================================================
//      3. p5 drawing
// ========================================================

function redrawBackgroundAndSetTextConfig() {
  background(255);
  fill(60);
}