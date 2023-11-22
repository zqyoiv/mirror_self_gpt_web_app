class MirrorSelfDisplayer {
    constructor () {
    }

    init() {}

    display() {
        let mirrorHTML = "<p>Ok, let's talk!</p>";
        let container = document.getElementById("question-container");
        container.innerHTML = mirrorHTML;
    }

}