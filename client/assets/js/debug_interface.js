IS_DEBUG = true;

const answerSubmitButton = document.getElementById('answer-submit-button');
const configGPTResponseDiv = document.getElementById('prompt-config-gpt-reponse-container');

let questionDisplayer = new QuestionDisplayer();
let storyboardController = new StoryboardController();
let speechRecognition = speechRecognitionSetup();

// The main loop of the game.
class ExperienceLoop {
    run() {
        console.log("ExperienceLoop.run()");  

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
            if (storyboardController.state == QUESTION_STATE) {
                questionDisplayer.displayQuestion(i);
            } else if (storyboardController.state == MIRROR_STATE) {
                mirrorSelfDisplayer.display();
            }                
        }

        instructionPromise(0)
            .then((r0 => instructionPromise(1)))
            .then((r1 => instructionPromise(2)))
            .then((r2 => {
                storyboardController.state = QUESTION_STATE;
                startQuestion(0);
                speechRecognition.start();
            }))
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
    if (storyboardController.state == QUESTION_STATE) {
        sendAnswerToServer_debug(storyboardController, mirrorSelfDisplayer, questionDisplayer);
    } 
    if (storyboardController.state == MIRROR_STATE) {
        chatWithMirrorSelf_debug();
    }
});