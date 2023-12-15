// ========================================================
//  Contents:
//  1. UI Control
//  2. p5 drawing
// ========================================================

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
          fill("red");
          text("Please say something.", 30, 50);
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
  
  // ========================================================
  //      2. p5 drawing
  // ========================================================
  
  function redrawBackgroundAndSetTextConfig() {
    background(255);
    fill(60);
  }