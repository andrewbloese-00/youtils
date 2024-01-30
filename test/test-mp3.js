const Youtils = require("../index")

const VIDEO_URL = "https://www.youtube.com/watch?v=y5O3RjAPs00"
const expectedID = "y5O3RjAPs00"
const expectedPath = `${expectedID}.mp3`

async function test_mp3(){
    const { path , error } = await Youtils.getAudio(VIDEO_URL);
    if(error != undefined){
        console.warn("test_mp3 failed");
        console.error("Failed to download / convert video, more details below....");
        console.error(error);
    }
    if(!path.endsWith(expectedPath)) {
        console.warn("Test failed to return correct path: ");
        console.error(`Expected "${expectedPath}" got "${path}"`);
    }
    console.log("✅ test_mp3 passed!")
    console.log(`See results at: ${path}`)
}


module.exports = {test_mp3}




