/*
 * The storyboard has 2 part: 
 * 1. Question - User answer
 * 2. User - Mirror AI chat
 */ 
class StoryboardController {
    constructor () {
        // The state of the storyboard.
        // 0 is question state, 
        // 1 is mirror chatting state,
        // 2 is end.
        this.state = 0;
        // The question index of the current round.
        // Range from 0 to 8, total 9 questions.
        this.questionNumber = 0;
        this.totalQuestionNumber = 9;

        this.instructionTimer = 1 * 1000;
        this.questionTimer = 1 * 1000; // 5 minutes, 300 seconds
        this.mirrorChatTimer = 1 * 1000; // 5 minutes, 300 seconds

        // Each question has 3 states: 
        // QUESTION = 0;
        // USER_ANSWER = 1;
        // AI_ANSWER = 2;
        // FINISH = 3;
        this.questionState = 1;
    }

    nextState() {
        if (this.state < 2) {
            this.state += 1;
        }
    }

    nextQuestion() {
        if (this.questionNumber + 1 <= this.totalQuestionNumber - 1) {
            this.questionNumber = (this.questionNumber + 1);
        } else {
            this.nextState();
        }
    }

    nextStateInCurrentQuestion() {
        if (this.questionState != 3) {
            this.questionState = this.questionState + 1;
        }
    }

    isCurrentQuestionFinished() {
        return (this.questionState == 3);
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

    isQuestionMode() {
        return (this.state == 0);
    }

    isMirrorChatMode() {
        return (this.state == 1);
    }

    isInGame() {
        return (this.state < 2);
    }
}