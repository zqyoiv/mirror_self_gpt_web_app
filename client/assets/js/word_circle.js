// Count down visual for mirror state.

class WordCircle {
    constructor () {
        this.paragraph = "";
        this.characters;
        this.totalDuration = 180000; // total duration of 3 minutes in milliseconds
        this.disappearInterval;
        this.startTime;
    }

    setup(input) {
        this.paragraph = input;
        textAlign(CENTER, CENTER);
        textSize(14);
        textFont('Georgia'); 
        this.characters = this.paragraph.split('');
        this.disappearInterval = this.totalDuration / this.characters.length;
    }

    startTimer() {
        this.startTime = millis();
        sleep(this.totalDuration)
            .then(() => {
                removeAllSpeechFiles();
                window.location.reload();
            });
    }

    draw() {
        background(0);
        // Calculate the angle between each character
        let angleStep = TWO_PI / this.characters.length;

        push();
        translate(width / 2, height*2/5);

        for (let i = 0; i < this.characters.length; i++) {
            if (millis() > this.startTime + i * this.disappearInterval) {
            continue; // Skip drawing this character
            }

            let angle = i * angleStep - PI / 2;
            let x = 150 * cos(angle);
            let y = 150 * sin(angle);

            push();
            translate(x, y);
            rotate(angle + PI / 2); // Rotate character to face outwards
            fill(255);
            textSize(14);
            textStyle(NORMAL);
            text(this.characters[i], 0, 0);
            pop();
        }

        // Draw countdown timer
        let remainingTime = this.totalDuration - (millis() - this.startTime);
        if (remainingTime < 0) {
            remainingTime = 0;
        }
        let minutes = floor(remainingTime / 60000);
        let seconds = floor((remainingTime % 60000) / 1000);
        fill(255);
        textSize(26);
        textStyle(NORMAL);
        text(nf(minutes, 2) + ":" + nf(seconds, 2), 0, 0);
        
        pop();
    }
}