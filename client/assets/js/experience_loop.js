const answerSubmitButton = document.getElementById('answer-submit-button');
const answerInput = document.getElementById('answer-input');
const configGPTResponseDiv = document.getElementById('prompt-config-gpt-reponse-container');

let questionDisplayer = new QuestionDisplayer();
let storyboardController = new StoryboardController();

// The main loop of the game.
class ExperienceLoop {
    run() {
        console.log("ExperienceLoop.run()");
        let mirrorSelfDisplayer = new MirrorSelfDisplayer();
        let promptProcessor = new PromptProcessor();
        
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

        function startQuestion(i) {
            questionDisplayer.displayQuestion(i);       
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
            .then((r2 => startQuestion(0)))
            .then((finalResult) => {
                console.log("ExperienceLoop.run(): promise chain finalResult");
            });

        // questionPromise(0)
        //     .then((result0) => questionPromise(1))
            // .then((result1) => questionPromise(2))
            // .then((result2) => questionPromise(3))
            // .then((result3) => questionPromise(4))
            // .then((result4) => questionPromise(5))
            // .then((result5) => questionPromise(6))
            // .then((result6) => questionPromise(7))
            // .then((result7) => questionPromise(8))
            // .then((result8) => mirrorPromise())
            // .then((finalResult) => {
            //     console.log("ExperienceLoop.run(): promise chain finalResult");
            // });
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
    sendAnswerToServer(storyboardController.questionNumber);
});

/* 
 * In Question - Answer phase, send user answer to server to update GPT
 * configuration.
 */
async function sendAnswerToServer(questionNumber) {
    // Get the answer input
    const answer = answerInput.textContent;
    addResponse(true, `<div>${answer}</div>`);

    // Add loading class to the submit button
    submitButton.classList.add("loading");

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
        questionDisplayer.displayQuestion(storyboardController.questionNumber);
        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}