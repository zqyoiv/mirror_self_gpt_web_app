async function sendAnswerToServer_debug(questionNumber) {
    // Get the answer input
    const answer = answerInput.textContent;
    addResponse(true, `<div>${answer}</div>`);

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
        addResponse(false, `<div>${responseText}</div>`);
        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}

/* 
 * In Mirror state, talk to gpt with configured prompt.
 */
async function chatWithMirrorSelf_debug() {
    // Get the answer input
    const chat = answerInput.textContent;
    if (chat == "") { return;}
    
    console.log("chatWithMirrorSelf(): chat: " + chat);
    const model = document.getElementById('model-select').value;
    addResponse(true, `<div>${chat}</div>`);

    // Clear the prompt input
    answerInput.textContent = '';

    try {
        // Send a POST request to the API with the prompt in the request body
        const response = await fetch('/chat-with-config-prompt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({chat, model})
        });
        if (!response.ok) {
            setErrorForResponse(responseElement, `HTTP Error: ${await response.text()}`);
            return;
        }
        const responseText = await response.text();
        addResponse(false, `<div>GPT prompt config response: \n${responseText}</div>`);
        return responseText;
    } catch (err) {
        const errorMsg = error.response ? error.response.data.error : `${error}`;
        console.error(errorMsg);
        return res.status(500).send(errorMsg);
    } finally {}
}