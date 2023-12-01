class MirrorSelfDisplayer {
    constructor () {
        this.mirrorStart = "Ok, let's talk!";
    }

    init() {}

    display() {
        if (IS_DEBUG) {
            let mirrorHTML = `<p>${this.mirrorStart}</p>`;
            let container = document.getElementById("question-container");
            container.innerHTML = mirrorHTML;
        }

        if (!IS_DEBUG) {
            redrawBackgroundAndSetTextConfig();
            text(
                this.mirrorStart,
                30,
                windowHeight / 2 - 50,
                windowWidth - 40,
                windowHeight / 2 - 50
                );
        }
    }

}