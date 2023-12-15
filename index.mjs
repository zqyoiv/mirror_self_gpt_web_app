import { createRequire } from 'module'
const require = createRequire(import.meta.url);
const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const model_name = "gpt-4-1106-preview";
let response_counter = 0;
let mirror_voice_name = "alloy";

import { PromptProcessor} from './prompt_processor.mjs';
import { get } from 'http';

let promptProcessor = new PromptProcessor();

app.use(cors());
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/', express.static(__dirname + '/client')); // Serves resources from client folder

// Set up Multer to handle file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'uploads/')
        },
        filename: function (req, file, cb) {
            const extension = path.extname(file.originalname);
            const filename = uuidv4() + extension;
            cb(null, filename);
        }
    }),
    limits: { fileSize: 1024 * 1024 * 10 }, // 10 MB
    fileFilter: function (req, file, cb) {
        const allowedExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
        const extension = path.extname(file.originalname);
        if (allowedExtensions.includes(extension)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'));
        }
    }
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
    try {
        const resp = await openai.audio.transcriptions.create(
            fs.createReadStream(req.file.path),
            "whisper-1",
            'text'
        );
        return res.send(resp.text);
    } catch (error) {
        const errorMsg = error.response ? error.response.error : `${error}`;
        console.log(errorMsg)
        return res.status(500).send(errorMsg);
    } finally {
        fs.unlinkSync(req.file.path);
    }
});

/* A normal GPT call. */
app.post('/get-prompt-result', async (req, res) => {
    // Get the prompt from the request body
    const {prompt, model = 'gpt'} = req.body;

    // Check if prompt is present in the request
    if (!prompt) {
        // Send a 400 status code and a message indicating that the prompt is missing
        return res.status(400).send({error: 'Prompt is missing in the request'});
    }

    try {
        // Use the OpenAI SDK to create a completion
        // with the given prompt, model and maximum tokens
        if (model === 'image') {
            const result = await openai.images.generate({
                prompt,
                response_format: 'url',
                size: '512x512'
            });
            return res.send(result.data[0].url);
        }
        if (model === 'chatgpt') {
            const result = await openai.chat.completions.create({
                model:model_name,
                messages: [
                    { "role": "user", "content": prompt }
                ]
            });
            return res.send(result.choices[0]?.message?.content);
        }
        const completion = await openai.chat.completions.create({
            model: 'text-davinci-003', // model name
            prompt: `Please reply below question in markdown format.\n ${prompt}`, // input prompt
            max_tokens: 4000
        });
        // Send the generated text as the response
        return res.send(completion.choices[0].text);
    } catch (error) {
        const errorMsg = error.response ? error.response.error : `${error}`;
        console.error(errorMsg);
        // Send a 500 status code and the error message as the response
        return res.status(500).send(errorMsg);
    }
});

/* In question mode, update gpt prompt configuration with user answer. */
app.post('/question-answer', async (req, res) => {
    // Get the answer and question number from the request body
    const {answer, questionNumber} = req.body;

    // Check if prompt is present in the request
    if (!answer) {
        return res.status(400).send({error: 'Answer is missing in the request'});
    }

    try {
        // Set mirror gender.
        if (questionNumber == 0) {
            if (answer.indexOf("she") != -1 || answer.indexOf("her") != -1) {
                mirror_voice_name = "alloy";
            } else if (answer.indexOf("he") != -1 || answer.indexOf("him") != -1) {
                mirror_voice_name = "onyx";
            } else {
                mirror_voice_name = "alloy";
            }
        }
        // TODO: Send question number and answer to the prompt processor to configure GPT.
        let updateResult = await promptProcessor.updatePromptWithAnswer(questionNumber, answer);
        return res.send(updateResult);
    } catch (error) {
        const errorMsg = error.response ? error.response.error : `${error}`;
        console.error(errorMsg);
        // Send a 500 status code and the error message as the response
        return res.status(500).send(errorMsg);
    }
});


/* Returns the consolidated fullConfigPrompt to client side. */
app.post('/get-config-prompt', async (req, res) => {
    try {
        // TODO: Send question number and answer to the prompt processor to configure GPT.
        let fullConfigPrompt = await promptProcessor.fullConfigPrompt();
        return res.send(fullConfigPrompt);
    } catch (error) {
        const errorMsg = error.response ? error.response.error : `${error}`;
        console.error(errorMsg);
        // Send a 500 status code and the error message as the response
        return res.status(500).send(errorMsg);
    }
});

/* In mirror-self mode, chat with this preset configuration. */
app.post('/chat-with-config-prompt', async (req, res) => {
    // Get the prompt from the request body
    const {chat, model = 'gpt'} = req.body;

    // Check if prompt is present in the request
    if (!chat) {
        // Send a 400 status code and a message indicating that the prompt is missing
        return res.status(400).send({error: 'Prompt is missing in the request' + chat + model});
    }

    let promptConfiguration = promptProcessor.fullConfigPrompt();
    console.log("promptConfiguration: " + promptConfiguration.length);

    async function getChatResult(chat) {
        const result = await openai.chat.completions.create({
            model:model_name,
            messages: [
                { "role": "user", "content": chat },
                { "role": "system", "content": promptConfiguration }
            ]
        });
        console.log("mirror full response: " + result.choices[0]?.message?.content);
        return result.choices[0]?.message?.content;
    
    }

    async function getSpeechResult(result) {
        if (result) {
            let mirrorText = "";
            let path = "";
            result = result.toLowerCase();
            if (result.split("mirror-self: ").length > 1) {
                // Take out text between "mirror-self:"" and "#mirrorend"
                mirrorText = result.split("mirror-self: ")[1];
                mirrorText = mirrorText.split("#mirrorend")[0];
                path = await sendTextToSpeech(mirrorText);
            } else {
                mirrorText = result;
                path = await sendTextToSpeech(result);
            }
            return {"mirrorText": mirrorText, "path": path};
        }
    }

    getChatResult(chat)
    .then(getSpeechResult)
    .then((obj) => {
        return res.send(obj);
    })
    .catch((error) => {
        const errorMsg = error.response ? error.response.error : `${error}`;
        console.error(errorMsg);
        // Send a 500 status code and the error message as the response
        return res.status(500).send(errorMsg);
    });
});

/* Text to speech call. */
app.post('/text-to-speech', async (req, res) => {
    const {text} = req.body;
    if (!text) {
        // Send a 400 status code and a message indicating that the prompt is missing.
        return res.status(400).send({error: 'Prompt is missing in the request'});
    }
    try {
        let speechFilePath = await sendTextToSpeech(text);
        return res.send(speechFilePath);
    } catch (error) {
        const errorMsg = error.response ? error.response.error : `${error}`;
        console.error(errorMsg);
        // Send a 500 status code and the error message as the response
        return res.status(500).send(errorMsg);
    }
});

async function sendTextToSpeech(text) {
    const fileName = "speech" + response_counter + ".mp3";
    response_counter += 1;
    const speechFilePath = "./client/" + fileName;
    const speechFile = path.resolve(speechFilePath);
    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: mirror_voice_name,
        input: text,
    });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    return "./" + fileName;
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Listening on port ${port}`));
