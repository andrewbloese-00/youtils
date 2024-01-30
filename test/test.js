const { test_mp3 } = require("./test-mp3")
const { test_mp4 } = require("./test-mp4")
const { test_transcribe } = require("./test-transcript")

const API_KEY = "<enter your openai api key here>"
async function test(){
    console.log("Running Tests...")
    console.time("tests")
    console.time("test_mp3")
    await test_mp3()
    console.timeEnd("test_mp3")

    console.time("test_mp4")
    await test_mp4()
    console.timeEnd("test_mp4")


    console.time("test_transcribe")
    await test_transcribe(API_KEY)
    console.timeEnd("test_transcribe")


    console.timeEnd("tests")

}
test()
