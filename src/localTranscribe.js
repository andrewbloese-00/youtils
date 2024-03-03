const { execSync } = require("child_process");
const ffmpeg = require("fluent-ffmpeg");
const { renameSync, unlinkSync } = require("fs");
const { PATH_TO_WHISPER_CPP, PATH_TO_MODEL } = process.env;
// const PATH_TO_WHISPER_CPP = "/Users/blaze/Development/favs/youtils/whisper-cpp"; //replace with path to where you install whisper.cpp
// const PATH_TO_MODEL = `models/ggml-base.en.bin`; //replace with path to install location of model

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
async function transcribeAudio(pathToMp3) {
  console.time("mp3 -> wav");
  const { wavFile, convertError } = await convertToWAV(pathToMp3);
  const oFile = pathToMp3.replace(".mp3", ".txt");
  console.timeEnd("mp3 -> wav");
  if (convertError) {
    console.warn("Local Transcribe Failed Due To 'Conversion Failure'");
    return { error: convertError };
  } else {
    const { text, err } = await whisper_cpp_wrapper(wavFile, oFile);
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
      `./main -m ${PATH_TO_MODEL} -f '${pathToInputWAV}' -otxt`,
      {
        cwd: PATH_TO_WHISPER_CPP,
      },
    );
    //move/rename to correct output file
    renameSync(`${pathToInputWAV}.txt`, outfile);

    //cleanup wav
    console.time(`WAV --> TRASH`);
    unlinkSync(pathToInputWAV);
    console.timeEnd(`WAV --> TRASH`);
    //resolve with the whisper call result
    resolve({ text: whipser_stdout.toString("utf8") });
  });
}

async function test() {
  console.time("whisper_wrapper");
  const { text, error } = await transcribeAudio(
    "/Users/blaze/Development/favs/youtils/test/elon-lawsuit.mp3",
  );
  console.timeEnd("whisper_wrapper");
  if (error) console.error(error);
  else console.log(`Transcribed ${text.length} characters to text file`);
}
test();
