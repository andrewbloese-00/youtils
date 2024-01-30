const Youtils = require("../index")
const VIDEO_URL = "https://www.youtube.com/watch?v=y5O3RjAPs00"
async function test_transcribe(api_key){
    const {transcription, error} = await Youtils.getTranscription(VIDEO_URL,api_key)
    if(error){
        console.warn("test_transcribe failed....")
        console.error(error)
        return 
    }
    console.log("✅ test_transcribe passed!")
    console.log("Transcript content....")
    console.log(transcription)
}


module.exports = {test_transcribe}




