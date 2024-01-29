const { transcriptionCompletion } = require("./aiUtils")
const MediaUtils = require("./mediaUtils")


class Youtils { 
    /** 
     * @param {string} url 
     * @returns {Promise<{path?: string, error?:unknown}>}>}
     */
    static async downloadVideo(url){
        const {data,error} = await MediaUtils.downloadVideo(url)
        return { path:data, error}
    }

    /** 
     * @param {string} url 
     * @returns {Promise<{path?: string, error?:unknown}>}>}
     */
    static async getVideoAudio(url){
        const { data , error } = await MediaUtils.downloadAndConvertToMp3(url);
        return { error,path: data};
    }

    /** 
     * @param {string} url the video to transcribe
     * @returns {Promise<{transcription?: string, error?:unknown}>}>}
     */
    static async transcribeVideo(url){
        const audio = await Youtils.getVideoAudio(url);
        if(audio.error) return {transcription:undefined, error:audio.error};
        const audioBuffer = MediaUtils.getFileBuffer(audio.path);
        const completion = await transcriptionCompletion(audioBuffer);
        if(completion.error) return { error: completion.error, transcription: undefined};
        return { transcription: completion.text, error: undefined};
    }
}

module.exports = {Youtils};