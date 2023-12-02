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
        this.state = -1;
        // The question index of the current round.
        // Range from 0 to 8, total 9 questions.
        this.questionNumber = 0;
        this.totalQuestionNumber = 8;
        this.isQuestion6Yes = true;

        this.instructionTimer = 1 * 1000;
        this.questionTimer = 1 * 1000; // 5 minutes, 300 seconds
        this.mirrorChatTimer = 1 * 1000; // 5 minutes, 300 seconds
    }

    nextState() {
        if (this.state < END_STATE) {
            if (!IS_DEBUG) {
                this.state += 1;
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

    nextQuestion() {
        if (this.questionNumber + 1 <= this.totalQuestionNumber - 1) {
            // Question 5 yes leads to question 6, no leads to question 7.
            if (this.questionNumber == 5) {
                this.questionNumber = this.isQuestion6Yes ? 6 : 7;
            } else if (this.questionNumber == 6) {
                // skip question 7
                this.questionNumber = 8;
            } else {
                this.questionNumber = (this.questionNumber + 1);
            }
        } else {
            this.nextState();
        }
    }

    getInstructionTimer() {
        return this.instructionTimer;
    }

    getQuestionTimer() {
        return this.questionTimer;
    }

    getMirrorChatTimer() {
        return this.mirrorChatTimer;
    }

    getTotalQuestionNumber () {
        return this.totalQuestionNumber;
    }
}