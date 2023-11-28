class QuestionDisplayer {
    constructor () {
        this.instructionList = [
            "Please take a seat, push the button in front of you to start.",
        ];

        this.questionList = [
            "Q1. Do you think your self is unique and certain?",
            "Q2. How would you describe yourself?",
            "Q3. What are your roles in life? And in your work?",
            "Q4. Is there another you hidden inside your body?",
            "Q5. What kind of person is he/she specifically? How does he/she treat people?  How does he/she view the world?",
            "Q6. If you were to describe your inner self as a house, what would it be like? What do you see? Is it night or day? What season is it? Where does the light come in from?",
            "Q7. If you had to open a room in such a house just for your other self, where would that be?",
            "Q8. What would he/she be doing there?",
            "Q9. Describe a scene that scares you, tell me why, and tell me what you see.",
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

    displayQuestion(questionNumber) {
        if (questionNumber < this.questionList.length) {
            if (IS_DEBUG) {
                // Add a HTML content rendering the string of the qudstionList[questionNumber].
                let question = this.questionList[questionNumber];
                let questionHTML = "<p>" + question + "</p>";
                let container = document.getElementById("question-container");
                container.innerHTML = questionHTML;
            }

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