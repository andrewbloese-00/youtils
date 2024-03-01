const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg");
const MP3Cutter = require("mp3-cutter");
const mp3Duration = require("mp3-duration");
const {
  createWriteStream,
  createReadStream,
  readFile,
  promises: { unlink },
} = require("fs");
const { default: OpenAI } = require("openai");

const DL_PATH = `${__dirname}/tmp`;

const getVideoId = (url) => url.split("v=").pop().split("&")[0];

/**
 * @about NEVER 'rejects' see return
 * @param {string} pathToMp4 the path to the mp4 file to extract audio from
 * @param {Boolean} removeSrc should the original mp4 file be deleted?
 * @returns {Promise<{data?:string, error?:unknown}>} data: 'path/to/<videoId>.mp4'|undefined, error:<error message> | undefined
 */
const downloadVideo = (url) =>
  new Promise((resolve) => {
    const videoId = getVideoId(url);

    const destinationPath = `${DL_PATH}/${videoId}.mp4`;
    const destination = createWriteStream(destinationPath);

    //filter for mp4 formats with audio
    const filter = (fmt) =>
      fmt.hasAudio && fmt.hasVideo && fmt.container == "mp4";
    ytdl(url, { filter })
      .pipe(destination)
      .on("finish", () => {
        resolve({ data: destinationPath, error: undefined });
      })
      .on("error", (err) => {
        console.warn("Error in mediaUtils.downloadVideo");
        console.error(err);
        resolve({ data: undefined, error: err });
      });
  });

/**
 * @about NEVER 'rejects' see return
 * @param {string} pathToMp4 the path to the mp4 file to extract audio from
 * @param {Boolean} removeSrc should the original mp4 file be deleted?
 * @returns {Promise<{data?:string, error?:unknown}>} data: 'path/to/<videoId>.mp3'|undefined, error:<error message> | undefined
 */
const convertToMp3 = (pathToMp4, removeSrc = false) =>
  new Promise((resolve) => {
    const process = new ffmpeg(pathToMp4, (err, video) => {
      if (err) {
        console.warn("failed to initialize ffmpeg in mediaUtils.convertToMp3");
        console.error(err);
        return resolve({ data: null, error: undefined });
      }
      const destinationPath = pathToMp4.replace(".mp4", ".mp3");
      video.fnExtractSoundToMP3(destinationPath, (err, file) => {
        if (err) return resolve({ data: null, error: err });
        if (removeSrc) {
          unlink(pathToMp4, (err) => {
            if (err) console.error(`failed to remove file '${pathToMp4}'`);
            return resolve({ data: destinationPath, error: undefined });
          });
        }
        return resolve({ data: destinationPath, error: undefined });
      });
    });
  });

/**
 * @about NEVER 'rejects' see return
 * @param {string} url the url of the youtube video to download and convert
 * @returns { Promise<{data?:string,error?:unknown}>} data: 'path/to/<videoId>.mp3'|undefined, error: any errors that occurred | undefined
 */
async function downloadAndConvertToMp3(url, cleanupMp4 = true) {
  const downloadResult = await downloadVideo(url);
  if (downloadResult.error) {
    console.warn("failed to download video, stoping downloadAndConvertToMp3");
    return { error: downloadResult.error, data: undefined };
  }

  const { data, error } = await convertToMp3(downloadResult.data, cleanupMp4);
  if (error) {
    console.warn("failed to convert video, stoping downloadAndConvertToMp3");
    return { error: error, data: undefined };
  }

  return { data, error: undefined };
}

/**
 *
 * @param {string} pathToFile the path to file to get bytes buffer
 * @returns {Promise<null|Buffer>}
 */
const getFileBuffer = (pathToFile) =>
  new Promise((resolve) => {
    readFile(pathToFile, (err, data) => {
      if (err) {
        console.error("Failed to read file buffer from file:", pathToFile);
        return resolve(null);
      }
      resolve(data); //return the buffer
    });
  });
const getFileStream = (pathToFile) => createReadStream(pathToFile);

/**
 * @typedef {{cleanup: "mp3" | "mp4" | "both", chunkSize: number}} VideoTranscriberOptions */

//use small chunks to speed up listening
const WHISPER_CHUNK_DURATION = 60; // 1 minute chunks

/**
 * @about helper: gets the duration of an audio file using promise instead of callback
 * @param {string} pathToMp3 path of mp3 to check the duration of
 * @returns {Promise<number>} on error returns 0, otherwise returns the length of the audio in seconds
 */
const getDurationSeconds = (pathToMp3) =>
  new Promise((resolve) => {
    mp3Duration(pathToMp3, (err, duration) => {
      if (err) {
        console.warn("error in mp3Duration callback");
        console.error(err);
        resolve(0);
      } else {
        resolve(duration);
      }
    });
  });

/**
 * @about on Error, will return any successfully created chunks. Outputs error message to log
 * @param {string} pathToMp3 the path to the mp3 file to be 'chunked'
 * @param {number} chunkDuration the max duration (in seconds) of each chunk to be generated
 * @returns {Promise<string[]>} the successfully chunked segments of audio generated from the given mp3
 */
async function chunkAudio(pathToMp3, chunkDuration = 240) {
  /**@type {string[]} */
  const chunks = [];
  try {
    const duration = await getDurationSeconds(pathToMp3);
    for (let t = 0; t < duration; t += chunkDuration) {
      const id = chunks.length; //time ordered sequential ids starting at 0
      const destinationPath = pathToMp3.replace(".mp3", `-chunk-${id}.mp3`);
      MP3Cutter.cut({
        src: pathToMp3,
        target: destinationPath,
        start: t,
        end: Math.min(duration, t + chunkDuration),
      });
      chunks.push(destinationPath);
    }
    return chunks;
  } catch (error) {
    console.warn("Failed to 'chunkAudio'");
    console.error(error);
    return chunks;
  }
}

/**
 *
 * @param {string} pathToMp3
 * @param {OpenAI} openai
 * @param {"text"|"srt"|"vtt"|"verbose_json"} format
 * @returns promise containing the result of calling openai api
 */
async function _transcriptionHelper(openai, pathToMp3, format = "text") {
  try {
    //create form input with audio file and model
    const res = await openai.audio.transcriptions.create({
      file: createReadStream(pathToMp3),
      model: "whisper-1",
    });
    return res.text || "";
  } catch (error) {
    console.warn("Failure in _transcriptionHelper()", pathToMp3);
    return null;
  }
}

/**
 * @about uses openai api to transcribe the given mp3 file. "Long files" (those exceeding 8 minutes in length) are automatically broken down into chunks and sent in parallel to be processesed. Joins text at the end in order of audio segment.
 * @param {OpenAI} openai
 * @param {string} pathToMp3 path to the mp3 file to transcribe
 * @param {number} chunkSize the length of each chunk to be generated (in seconds). Default 240 (4 minutes)
 * @note chunkSize ONLY FOR INPUTS > 8minutes. Default is 240 (4 minute chunks)
 * @returns {Promise<string|null>} The transcript or nothing
 */
async function transcribeAudio(
  openai,
  pathToMp3,
  chunkSize = WHISPER_CHUNK_DURATION,
) {
  try {
    const chunks = await chunkAudio(pathToMp3, chunkSize);
    const transcriberQueue = [];
    let transcript = "";

    for (let i = 0; i < chunks.length; i++)
      if (chunks[i].endsWith(".mp3"))
        transcriberQueue.push(_transcriptionHelper(openai, chunks[i], "text"));

    const settled = await Promise.allSettled(transcriberQueue);
    for (let i = 0; i < settled.length; i++) {
      if (settled[i].status === "fulfilled" && settled[i].value != null) {
        transcript += settled[i].value + " ";
      }
    }
    //cleanup created chunks automatically
    await Promise.allSettled(chunks.map((chunkPath) => unlink(chunkPath)));
    return transcript;
  } catch (error) {
    console.warn("Failed to transcribe audio");
    console.error(error);
    return null;
  }
}

// /**
//  * @about Options are default to cleanup: 'mp3', and chunkSize: 240 (4 minues)
//  * @note cleanup is used to determine which files to remove, if you want to remove both mp3 and mp4 use "both", just mp3? use "mp3" ...
//  * @param {string} pathToMp4 the path to the mp4 file to be transcribed
//  * @param {VideoTranscriberOptions} options
//  */
// export async function transcribeVideo(pathToMp4,options=DEFAULT_TRANSCRIBER_OPTIONS){
// 	try {
// 		let transcript = null;
// 		const {file,error} =  await mp4ToMp3(pathToMp4);
// 		if(error) {
// 			console.error(error);
// 			return {transcript, error};
// 		}
// 		transcript = await transcribeAudio(file,options.chunkSize)
// 		if(transcript === null) return { transcript, error: "Failed to transcribe audio..." }

// 		if(options.cleanup === 'both') await Promise.allSettled([unlink(pathToMp4),unlink(file)]) //delete src video and extracted audio
// 		if(options.cleanup === "mp4") await unlink(pathToMp4); //delete src video only
// 		if(options.cleanup === "mp3") await unlink(file); //delete extracted audio only

// 		return {transcript, error: null};

// 	} catch (error) {
// 		console.error(error)
// 		return {transcript:null, error: error.message||error||"Unknown"}
// 	}
// }

module.exports = {
  downloadAndConvertToMp3,
  downloadVideo,
  convertToMp3,
  getFileBuffer,
  getFileStream,
  transcribeAudio,
};
