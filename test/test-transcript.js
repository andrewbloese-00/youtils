const Youtils = require("../index");
const VIDEO_URL = "https://www.youtube.com/watch?v=Oh3dUT-E0tk";
async function test_transcribe(api_key) {
  Youtils.initOpenAI(api_key);
  //                                                          write
  const { error } = await Youtils.getTranscription(VIDEO_URL, true);
  if (error) {
    console.warn("test_transcribe failed....");
    console.error(error);
    return;
  }
  console.log("✅ test_transcribe passed!");
  console.log("Transcript content saved to downloads");
}

module.exports = { test_transcribe };
