const { transcriptionCompletion } = require("./aiUtils")
const MediaUtils = require("./mediaUtils")
const { rename } = require("fs/promises")
const {homedir} = require("os")
const { join } = require("path")
const getUserDownloadsPath = () => join(homedir(),"Downloads")


async function moveToDownloads(pathToFile){
        try {
            const fileName = pathToFile.split("/").pop()
            const finalDestination = join(getUserDownloadsPath(),fileName)
            await rename(pathToFile,finalDestination)
            return {path:finalDestination,error:undefined}
        } catch (error) {
            return { error, path: undefined}
        }
}



class Youtils { 
    /** 
     * @param {string} url 
     * @returns {Promise<{path?: string, error?:unknown}>}>}
     */
    static async getVideo(url){
        const {data,error} = await MediaUtils.downloadVideo(url)
        if(error) return { path: undefined, error}
        const moveResult = await moveToDownloads(data)
        if(moveResult.error) return { path: undefined, error: moveResult.error }
        return { path:moveResult.path, error: undefined}
        
    }

    /** 
     * @param {string} url 
     * @returns {Promise<{path?: string, error?:unknown}>}>}
     */
    static async getAudio(url){
        const { data , error } = await MediaUtils.downloadAndConvertToMp3(url);
        if(error) return { path: undefined, error}
        const moveResult = await moveToDownloads(data)
        if(moveResult.error) return { path: undefined, error: moveResult.error }
        return { path:moveResult.path, error: undefined}
    }

    /** 
     * @param {string} url the video to transcribe
     * @param {string} apiKey your openai API key to get a whisper completion
     * @returns {Promise<{transcription?: string, error?:unknown}>}>}
     */
    static async getTranscription(url,apiKey){
        if(!apiKey) return { transcription: undefined, error: "undefined api key"}
        const audio = await Youtils.getAudio(url)
        if(audio.error) return {transcription:undefined, error:audio.error};
        const move = await moveToDownloads(audio.path)
        if(move.error) return {transcription:undefined, error:move.error}
        const audioStream = MediaUtils.getFileStream(move.path);
        const completion = await transcriptionCompletion(audioStream,apiKey);
        if(completion.error) return { error: completion.error, transcription: undefined};
        return { transcription: completion.text, error: undefined};
    }
}

module.exports = {Youtils};


