## Setup
### Prerequisites
- Node.js
- OpenAI API Key
### Installation (Mac)
1. Clone the repository:
```sh
git clone https://github.com/ioanmo226/chatgpt-web-application
```
2. Install the dependencies:
```sh
npm install
```
3. Create a .env file in the root folder and add your OpenAI API key in the following format:
```sh
export OPENAI_API_KEY=your_api_key
```
If doesn't work, manually update OPEN_API_KEY in index.mjs and prompt_processor.mjs.
4. Start node server
```sh
node index.mjs
```
5. Now when you navigate to http://localhost:3001 you will see web response.
6. To see portrait visual: open following app in a seperate window.
```sh
https://mirror-portrait-05692208a0fa.herokuapp.com/
```
### Debug Mode
#### UI workflow debug
1. Open app as normal
2. Answer question by pressing "1"(single word answer) and "2" (for more word answer).
   
#### Prompt Adjusting
1. go to client/assets/js/constant.js
change line 7 to:
```sh
let IS_DEBUG = true;
```
2. Start server like step 4 above, in browser, go to:
```sh
http://localhost:3001/debug.html
```
In debug mode you can see all GPT responses in text.
