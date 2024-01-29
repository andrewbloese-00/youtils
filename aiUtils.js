require("dotenv").config()
const { OpenAI } = require("openai")
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY
})


/**
 * 
 * @param {Buffer} file the bytes of the audio file to transcribe
 * @returns {Promise<{text?:string,error?:unknown}>}
 */
const transcriptionCompletion = async file =>{
    try {
        const {text} = await openai.audio.transcriptions.create({
            file,
            model: "whisper-1",
            response_format: "text"
        })
        return {text,error:undefined};
    } catch (error) {
        return {text:undefined, error}
    }

}





module.exports = {transcriptionCompletion}

