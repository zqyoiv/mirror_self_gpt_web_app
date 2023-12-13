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
exportOPENAI_API_KEY=your_api_key
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

