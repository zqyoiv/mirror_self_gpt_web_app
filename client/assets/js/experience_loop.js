const answerSubmitButton = document.getElementById('answer-submit-button');
const answerInput = document.getElementById('answer-input');
const configGPTResponseDiv = document.getElementById('prompt-config-gpt-reponse-container');

let mirrorSelfDisplayer = new MirrorSelfDisplayer();
let questionDisplayer = new QuestionDisplayer();
let storyboardController = new StoryboardController();

// The main loop of the game.
class ExperienceLoop {
    run() {
        console.log("ExperienceLoop.run()");  
        let userSpeechProcessor = new UserSpeechProcessor();

        // Set timer for each instruction displayed before question phase
        // on the screen.
        // i is the index of instruction, there are 3 instructions in total.
        function instructionPromise(i) {
            return new Promise((resolve, reject) => {
                questionDisplayer.displayInstruction(i);
                sleep(storyboardController.getInstructionTimer())
                    .then(() => {
                        resolve();
                    });
                });
        }

        function start(i) {
            if (storyboardController.state == 0) {
                questionDisplayer.displayQuestion(i);
            } else if (storyboardController.state == 1) {
                mirrorSelfDisplayer.display();
            }                
        }

        function mirrorPromise() {
            return new Promise((resolve2, reject2) => {
                mirrorSelfDisplayer.display();
                userSpeechProcessor.startRecording();
                sleep(storyboardController.getMirrorChatTimer())
                    .then(() => {
                        userSpeechProcessor.endRecording();
                        // TODO: send userAnswer to GPT.
                        let userAnswer = userSpeechProcessor.voiceToText();
                        resolve2();
                    });
            });
        }

        instructionPromise(0)
            .then((r0 => instructionPromise(1)))
            .then((r1 => instructionPromise(2)))
            .then((r2 => start(0)))
            .then((finalResult) => {
                console.log("ExperienceLoop.run(): promise chain finalResult");
            });
    }
}

answerInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        if (event.ctrlKey || event.shiftKey) {
            document.execCommand('insertHTML', false, '<br/><br/>');
        } else {
            getGPTResult();
        }
    }
});

answerSubmitButton.addEventListener("click", () => {
    if (storyboardController.state == 0) {
        sendAnswerToServer(storyboardController.questionNumber);
    } else if (storyboardController.state == 1) {
        chatWithMirrorSelf();
    }
});

/* 
 * In Question - Answer state, send user answer to server to update GPT
 * configuration.
 */
async function sendAnswerToServer(questionNumber) {
    // Get the answer input
    const answer = answerInput.textContent;
    addResponse(true, `<div>${answer}</div>`);

    // Clear the prompt input
    answerInput.textContent = '';

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
        addResponse(false, `<div>GPT prompt config response: \n${responseText}</div>`);
        storyboardController.nextQuestion();
        if (storyboardController.state == 0) {
            questionDisplayer.displayQuestion(storyboardController.questionNumber);
        } else if (storyboardController.state == 1) {
            mirrorSelfDisplayer.display();
        }
        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
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
        addResponse(false, `<div>GPT prompt config response: \n${responseText}</div>`);
        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}