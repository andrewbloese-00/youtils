//aiUtils - wrapper for openai whisper-1 completion 
const { OpenAI } = require("openai");

/**
 * 
 * @param {ReadableStream} mp3ReadStream 
 * @param {string} openai_key 
 * @returns {Promise<{error?:unknown, data:string}}
 */
async function transcriptionCompletion(mp3ReadStream,openai_key){
    const openai = new OpenAI({apiKey:openai_key})
    try {
        const {text} = await openai.audio.transcriptions.create({
            file: mp3ReadStream,
            model: "whisper-1"
        })    
        return { text, error: undefined }         
    } catch (error) {
        return { text: undefined, error }
    }
}






module.exports = {transcriptionCompletion}

