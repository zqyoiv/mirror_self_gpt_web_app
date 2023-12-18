const INSTRUCTION_STATE = -1;
const QUESTION_STATE = 0;
const LOADING_STATE = 1;
const MIRROR_STATE = 2;
const END_STATE = 3;

let IS_DEBUG = false;
// In non-audio mode, use enter to submit answer for question state.
// But in mirror state they still use audio.
let IS_AUDIO_MODE = false;