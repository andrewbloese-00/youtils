const { test_mp3 } = require("./test-mp3");
const { test_mp4 } = require("./test-mp4");
const { test_transcribe } = require("./test-transcript");
require("dotenv").config();

const API_KEY = process.env.OPENAI_SECRET_KEY;
async function test() {
  console.log("Running Tests...");
  console.time("tests");
  // //mp3 downloader test
  // console.time("test_mp3");
  // await test_mp3();
  // console.timeEnd("test_mp3");

  // //mp4 downloader test
  // console.time("test_mp4");
  // await test_mp4();
  // console.timeEnd("test_mp4");

  //transcriber test
  console.time("test_transcribe");
  await test_transcribe(API_KEY);
  console.timeEnd("test_transcribe");

  console.timeEnd("tests");
}
test();
