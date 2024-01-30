const Youtils = require("../index")


const VIDEO_URL = "https://www.youtube.com/watch?v=y5O3RjAPs00"
const expectedID = "y5O3RjAPs00"
const expectedPath = `${expectedID}.mp4`

async function test_mp4(){
    const { path , error } = await Youtils.getVideo(VIDEO_URL);
    if(error != undefined){
        console.warn("test_mp4 failed");
        console.error("Failed to download video, more details below....");
        console.error(error);
    }
    if(!path.endsWith(expectedPath)) {
        console.warn("Test failed to return correct path: ");
        console.error(`Expected "${expectedPath}" got "${path}"`);
    }
    console.log("✅ test_mp4 passed!")
}

module.exports = {test_mp4}




