const { transcriptionCompletion } = require("./aiUtils")
const MediaUtils = require("./mediaUtils")

class Youtils { 
    /** 
     * @param {string} url 
     * @returns {Promise<{path?: string, error?:unknown}>}>}
     */
    static async getVideo(url){
        const {data,error} = await MediaUtils.downloadVideo(url)
        return { path:data, error}
    }

    /** 
     * @param {string} url 
     * @returns {Promise<{path?: string, error?:unknown}>}>}
     */
    static async getAudio(url){
        const { data , error } = await MediaUtils.downloadAndConvertToMp3(url);
        return { error,path: data};
    }

    /** 
     * @param {string} url the video to transcribe
     * @param {string} apiKey your openai API key to get a whisper completion
     * @returns {Promise<{transcription?: string, error?:unknown}>}>}
     */
    static async getTranscription(url,apiKey){
        if(!apiKey) return { transcription: undefined, error: "undefined api key"}
        const audio = await Youtils.getVideoAudio(url);
        if(audio.error) return {transcription:undefined, error:audio.error};
        const audioStream = MediaUtils.getFileStream(audio.path);
        const completion = await transcriptionCompletion(audioStream,apiKey);
        if(completion.error) return { error: completion.error, transcription: undefined};
        return { transcription: completion.text, error: undefined};
    }
}

module.exports = {Youtils};


