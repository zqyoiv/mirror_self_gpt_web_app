/*
 * The storyboard has 2 part: 
 * 1. Question - User answer
 * 2. User - Mirror AI chat
 */ 
class StoryboardController {
    constructor () {
        // The state of the storyboard.
        // 0 is question state, 
        // 1 is loading state,
        // 2 is mirror chatting state,
        // 3 is end.
        this.state = INSTRUCTION_STATE;

        this.instructionNumber = 0;
        this.totalInstructionNumber = 3;

        // The question index of the current round.
        // Range from 0 to 8, total 9 questions.
        this.questionNumber = 0;
        this.totalQuestionNumber = 9;
        this.isQuestion6Yes = true;

        this.instructionTimer = 1 * 1000;
        this.mirrorTimer = 180;
        this.mirrorStartTimer = "";
    }

    nextState() {
        if (this.state < END_STATE) {
            if (!IS_DEBUG) {
                this.state += 1;
                if (this.state == MIRROR_STATE && this.mirrorStartTimer == "") {
                    this.mirrorStartTimer = millis();
                    console.log("mirrorStartTimer start: " + this.mirrorStartTimer);
                }
                if (this.state == LOADING_STATE) {
                    makeFirstMirrorCall(); 
                }
            }

            if (IS_DEBUG) {
                // debug mode don't have loading.
                if (this.state == QUESTION_STATE) {
                    this.state = MIRROR_STATE;
                } else if (this.state == MIRROR_STATE) {
                    this.state = END_STATE;
                }
            }
        }
    }

    nextInstruction() {
        console.log("next instruction from: " + this.instructionNumber);
        if (this.instructionNumber + 1 <= this.totalInstructionNumber - 1) {
            this.instructionNumber += 1;
        } else {
            this.nextState();
        }
    }

    mirrorCountDowntext() {
        // Calculate the elapsed time
        let elapsedTime = (millis() - this.mirrorStartTimer) / 1000;

        // Calculate remaining time
        let remainingTime = this.mirrorTimer - elapsedTime;

        if (remainingTime <= 0) {
            this.state = END_STATE;
        }

        // Convert to minutes and seconds
        let minutes = floor(remainingTime / 60);
        let seconds = floor(remainingTime % 60);

        // Format the time
        let displayTime = nf(minutes, 2) + ":" + nf(seconds, 2);
        return displayTime;
    }

    nextQuestion() {
        console.log("next question from: " + this.questionNumber);
        // Intentionally make questionNumber out of bound for the last question,
        // because we need to push button to submit answer for q8 and start loading.
        if (this.questionNumber + 1 <= this.totalQuestionNumber) {
            // Question 5 yes leads to question 6, no leads to question 7.
            if (this.questionNumber == 6 || this.questionNumber == 7) {
                // skip question 7
                this.questionNumber = 8;
            } else {
                this.questionNumber = (this.questionNumber + 1);
            }
        }
    }
}