// ========================================================
//  Contents:
//  1. ChatGPT call utilities.
//  2. Video call utilities.
//  3. Serial communication related utilities.
//  4. Audio play related utility functions.
// ========================================================

let gptAudio;

let video_server_ip = "https://mirror-portrait-05692208a0fa.herokuapp.com/";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ========================================================
//     1. ChatGPT call utilities.
// ========================================================

const answerInput = document.getElementById('answer-input');

function addResponse(selfFlag, prompt) {
    const uniqueId = generateUniqueId();
    const html = `
            <div class="response-container ${selfFlag ? 'my-question' : 'chatgpt-response'}">
                <img class="avatar-image" src="assets/img/${selfFlag ? 'me' : 'chatgpt'}.png" alt="avatar"/>
                <div class="prompt-content" id="${uniqueId}">${prompt}</div>
            </div>
        `
    responseList.insertAdjacentHTML('beforeend', html);
    responseList.scrollTop = responseList.scrollHeight;
    return uniqueId;
}

/* 
 * In Question - Answer state, send user answer to server to update GPT
 * configuration.
 */
async function sendAnswerToServer(answer, questionNumber, storyboardController) {
    try {
        // Send a POST request to the API with the prompt in the request body
        const response = await fetch('/question-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answer,
                questionNumber
            })
        });
        if (questionNumber == 5) {
          if (answer.indexOf('es') != -1) { 
            storyboardController.isQuestion6Yes = true;
          } else { 
            storyboardController.isQuestion6Yes = false;
          }
        }

        if (!response.ok) {
            setErrorForResponse(responseElement, `HTTP Error: ${await response.text()}`);
            return;
        }
        const responseText = await response.text();

        // Set mirror state word circle parameters as response for question 4.
        if (questionNumber == 4) {
          wordCircle.setup(responseText);
        }

        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}

async function makeFirstMirrorCall() {
  let firstChat = `For the first respond, You must express your thoughts about user creating this
  "room" for you(use  your tone, match your personality). End smoothly with a daily question, 
  e.g."Got any vacation plans coming up?"
  "What'd you have for breakfast?"
  "What did you get up to last weekend?"
  "Reading anything interesting lately? Or what was the last book you read?"
  "Caught any good movies or TV shows recently?"
  "How do you like to chill out after a long day?"
  "Anything cool or interesting happen to you this week?"
  "How do you usually kick back on the weekends?"]`;
  chatWithMirrorSelf(firstChat);
}

/* 
 * In Mirror state, talk to gpt with configured prompt.
 */
async function chatWithMirrorSelf(chat) {
    try {
        // Send a POST request to the API with the prompt in the request body
        const response = await fetch('/chat-with-config-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({chat, model})
        });
        if (!response.ok) {
            setErrorForResponse(responseElement, `HTTP Error: ${await response.text()}`);
            return;
        }
        const responseObject = await response.json();
        let mirrorText = responseObject["mirrorText"];
        if (responseObject["path"]) {
            gptAudio = new Audio(responseObject["path"]);
            speechRecognition.stop();
            gptAudio.play();
        }
        // switch from loading state to mirror state.
        if (storyboardController.state == LOADING_STATE) {
          loadingStateButtonSetup();
          // stop recording video and play in loading scene.
          sendStopAndPlayRequest();
          serial.write("All Set");
          console.log("--------------------- All set sent ----------------------");
          mirrorStateButtonSetup();
          storyboardController.nextState();
          wordCircle.startTimer();
        }
        if (storyboardController.state == MIRROR_STATE) {
          mirrorStateButtonSetup();
        }
        addResponse(false, `<div>Mirror response: \n${mirrorText}</div>`);
        return mirrorText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

// ========================================================
//     2. Video call utilities.
// ========================================================

// Start recording video when the first next button is pressed.
function sendStartRecordRequest() {
  console.log("Start recording video called.");
  fetch(video_server_ip + 'start_record')
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

// Stop and play the video in loading stage.
function sendStopAndPlayRequest() {
  console.log("Stop and play video called.");
  fetch(video_server_ip + 'stop_and_play')
    .then(response => response.text())
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
}

// ========================================================
//      3. Serial communication related utilities.
// ========================================================
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

// ========================================================
//      4. Audio play related utility functions.
// ========================================================

const seasonAudioUrls = [
  'assets/audio/season/spring2.mp3',
  'assets/audio/season/summer.mp3',
  'assets/audio/season/autumn.mp3',
  'assets/audio/season/winter.mp3',
];

const dayAudioUrls = [
  'assets/audio/day/day.wav',
  'assets/audio/day/night.mp3',
];

let dayAudioFiles;
let seasonAudioFiles;

function preloadAudio() {
  dayAudioFiles = dayAudioUrls.map(url => {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto'; 
    audio.load();
    return audio;
  });

  seasonAudioFiles = seasonAudioUrls.map(url => {
    const audio = new Audio();
    audio.src = url;
    audio.preload = 'auto'; 
    audio.load();
    return audio;
  });
}

function playSeasonMusicFromText(text) {
  let season = 0;
  text = text.toLowerCase();
  if (text.indexOf("spring") != -1) {
    season = 1;
  } else if (text.indexOf("summer") != -1) {
    season = 2;
  } else if (text.indexOf("autumn") != -1) {
    season = 3;
  } else if (text.indexOf("winter") != -1) {
    season = 4;
  }

  let seasonAudio;
  switch (season) {
    case 1:
      seasonAudio = seasonAudioFiles[0];
      break;
    case 2:
      seasonAudio = seasonAudioFiles[1];
      break;
    case 3:
      seasonAudio = seasonAudioFiles[2];
      break;
    case 4:
      seasonAudio = seasonAudioFiles[3];
      break;
  }
  if (seasonAudio) {
    seasonAudio.loop = true;
    seasonAudio.play();
  }
}

function playDayNightMusicFromText(text) {
  let timeIndicator = 0;
  text = text.toLowerCase();
  if (text.indexOf("day") != -1) {
    timeIndicator = 1;
  } else if (text.indexOf("night") != -1) {
    timeIndicator = 2;
  }
  switch (timeIndicator) {
    case 1:
      dayAudioFiles[0].loop = true;
      dayAudioFiles[0].play();
      break;
    case 2:
      dayAudioFiles[1].loop = true;
      dayAudioFiles[1].play();
      break;
  }
}
