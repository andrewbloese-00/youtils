const { chunkAudio } = require("./mediaUtils");
const { execSync } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const { renameSync, unlinkSync, writeFileSync } = require("fs");
const { unlink } = require("fs/promises");
// require("dotenv").config();
// const { PATH_TO_WHISPER_CPP, PATH_TO_MODEL } = process.env;
const PATH_TO_WHISPER_CPP = "/Users/blaze/whisper-cpp/whisper.cpp"; //replace with path to where you install whisper.cpp
const PATH_TO_MODEL = `models/ggml-base.en.bin`; //replace with path to install location of model
// console.log({ PATH_TO_WHISPER_CPP, PATH_TO_MODEL });

//self explanatory, uses ffmpeg
const convertToWAV = (pathToMp3) =>
  new Promise((resolve) => {
    const wavFile = pathToMp3.replace(".mp3", ".wav");
    ffmpeg(pathToMp3)
      .toFormat("wav")
      .audioFrequency(16000)
      .on("error", (err) => {
        console.error(err);
        resolve({ convertError: err });
      })
      .save(wavFile)
      .on("end", () => {
        resolve({ wavFile });
      });
  });

//converts mp3 to wav,then uses 'whisper.cpp' to write the transcript to a text file
async function transcribeAudio(pathToMp3, useOutput) {
  console.time("mp3 -> wav");
  const { wavFile, convertError } = await convertToWAV(pathToMp3);
  const oFile = pathToMp3.replace(".mp3", ".txt");
  console.timeEnd("mp3 -> wav");
  if (convertError) {
    console.warn("Local Transcribe Failed Due To 'Conversion Failure'");
    return { error: convertError };
  } else {
    console.log("Launching Whisper with model: ", PATH_TO_MODEL);
    const { text, err } = await whisper_cpp_wrapper(
      wavFile,
      useOutput ? oFile : false,
    );
    if (err) {
      console.error(err);
      return { error: err };
    } else return { text };
  }
}

//`git clone https://github.com/ggerganov/whisper.cpp` to dowload whisper.cpp, then follow instructions in the readme to build it.
// configure PATH_TO_WHISPER_CPP and PATH_TO_MODEL in your local .env.
// calls whisper.cpp using the provided wav file as input and transcribes to the specified 'outfile' in text format (.txt).
function whisper_cpp_wrapper(pathToInputWAV, outfile) {
  return new Promise((resolve) => {
    const whipser_stdout = execSync(
      `./main -m ${PATH_TO_MODEL} -f "${pathToInputWAV}" ${outfile ? "-otxt" : ""}`,
      {
        cwd: PATH_TO_WHISPER_CPP,
      },
    );
    if (outfile) {
      //move/rename to correct output file
      //whisper cpp outputs text file as <wav filename>.wav.txt
      renameSync(`${pathToInputWAV}.txt`, outfile);
    }

    //cleanup wav
    unlinkSync(pathToInputWAV);
    //resolve with the whisper call result
    resolve({ text: whipser_stdout.toString("utf8") });
  });
}

class WhisperCPPWrapper {
  static async transcribe(pathToMp3, useOutputFile = false) {
    const chunks = await chunkAudio(pathToMp3, 600); //10mins
    const q = [];
    for (let chunk of chunks) q.push(transcribeAudio(chunk));
    const done = await Promise.allSettled(q);
    let text = [];
    for (let processedChunk of done) {
      if (processedChunk.status === "fulfilled" && !processedChunk.value.error)
        text.push(processedChunk.value.text);
    }
    const transcript = text.join("\n");
    if (useOutputFile)
      writeFileSync(pathToMp3.replace(".mp3", ".txt"), transcript, "utf8");
    //cleanup mp3 chunks
    await Promise.allSettled(chunks.map((chunk) => unlink(chunk)));
    return transcript;
  }
}

async function test() {
  console.time("whisper_wrapper");
  const t_start = performance.now();
  const text = await WhisperCPPWrapper.transcribe(
    "/Users/blaze/Development/favs/youtils/test/elon-lawsuit.mp3",
    false,
  );
  console.timeEnd("whisper_wrapper");

  const t_end = performance.now();
  setTimeout(() => {
    console.clear();
    console.log(`[${PATH_TO_MODEL}] Transcription\n${text}`);
    console.log(`Completed in ${(t_end - t_start).toFixed(3)}ms`);
  }, 1000);
}
// test();
module.exports = { WhisperCPPWrapper };
