let IS_DEBUG = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function redrawBackgroundAndSetTextConfig() {
    background(0);
    fill(255);
    textSize(42);
}
// ========================================================
//     ChatGPT call utilities.
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
async function sendAnswerToServer(answer, questionNumber) {
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
        if (!response.ok) {
            setErrorForResponse(responseElement, `HTTP Error: ${await response.text()}`);
            return;
        }
        const responseText = await response.text();
        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}

async function sendAnswerToServerWithQuestionNumber(questionNumber) {
    // Get the answer input
    const answer = answerInput.textContent;
    addResponse(true, `<div>${answer}</div>`);

    // Clear the prompt input
    answerInput.textContent = '';

    sendAnswerToServer(answer, questionNumber);
}


/* 
 * In Mirror state, talk to gpt with configured prompt.
 */
async function chatWithMirrorSelf() {
    // Get the answer input
    const chat = answerInput.textContent;
    console.log("chatWithMirrorSelf(): chat: " + chat);
    const model = document.getElementById('model-select').value;
    addResponse(true, `<div>${chat}</div>`);

    // Clear the prompt input
    answerInput.textContent = '';

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
        const responseText = await response.text();
        // addResponse(false, `<div>GPT prompt config response: \n${responseText}</div>`);
        return responseText;
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
//      Serial communication related utilities.
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
//      Video recording related utility functions.
// ========================================================

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