class QuestionDisplayer {
    constructor () {
        this.instructionList = [
            "Welcome! Please take a seat and put on the headset, push the button to start.",
            "Over the next few minutes, you'll answer a few questions. Thoughtful responses make the experience more enjoyable.",
            "Your information will be deleted after this session. Let's begin!"
        ];

        this.questionList = [
            "Q1. Do you think your inside self is certain?",
            "Q2. What kind of person are you in your everyday life?",
            "Q3. If you were to describe yourself as a house, what would it be like?",
            "Q4. What time is the house, day or night?",
            "Q5. What season is the house in?",
            "Q6. Is there another self that doesn't normally appear in your daily life?",
            "Q7-1. What kind of person is he/she specifically?",
            "Q7-2. What do you think it would be like to be the complete opposite of yourself?",
            "Q8. If you had to open a room in such a house just for your other self, what kind of room would that be?",
        ];
    }

    displayInstruction(instructionNumber) {
        if (instructionNumber < this.instructionList.length) {
            if (IS_DEBUG) {
                // Add a HTML content rendering the string of the qudstionList[questionNumber].
                let instruction = this.instructionList[instructionNumber];
                let instructionHTML = "<p>" + instruction + "</p>";
                let container = document.getElementById("question-container");
                container.innerHTML = instructionHTML;
            }

            if (!IS_DEBUG) {
                // p5 interface version
                redrawBackgroundAndSetTextConfig();
                text(
                    this.instructionList[instructionNumber],
                    30,
                    windowHeight / 2 - 50,
                    windowWidth - 40,
                    windowHeight / 2 - 50
                );
            }
        }
    }

    displayQuestion(questionNumber) {
        console.log("display question number: " + questionNumber);
        if (questionNumber < this.questionList.length) {
            if (IS_DEBUG) {
                // Add a HTML content rendering the string of the qudstionList[questionNumber].
                let question = this.questionList[questionNumber];
                let questionHTML = "<p>" + question + "</p>";
                let container = document.getElementById("question-container");
                container.innerHTML = questionHTML;
            }

            if (!IS_DEBUG) {
                // p5 interface version
                redrawBackgroundAndSetTextConfig();
                text(
                    this.questionList[questionNumber],
                    30,
                    windowHeight / 2 - 50,
                    windowWidth - 40,
                    windowHeight / 2 - 50
                );
            }
        }
    }

}