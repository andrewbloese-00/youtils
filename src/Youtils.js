const MediaUtils = require("./mediaUtils");
const { rename } = require("fs/promises");
const { homedir } = require("os");
const { join } = require("path");
const { OpenAI } = require("openai");
const { writeFile } = require("fs/promises");

const getUserDownloadsPath = () => join(homedir(), "Downloads");

async function moveToDownloads(pathToFile) {
  try {
    const fileName = pathToFile.split("/").pop();
    const finalDestination = join(getUserDownloadsPath(), fileName);
    await rename(pathToFile, finalDestination);
    return { path: finalDestination, error: undefined };
  } catch (error) {
    return { error, path: undefined };
  }
}

class Youtils {
  static __openai = null;
  static initOpenAI(apiKey) {
    Youtils.__openai = new OpenAI({ apiKey });
  }
  /**
   * @param {string} url
   * @returns {Promise<{path?: string, error?:unknown}>}>}
   */
  static async getVideo(url) {
    const { data, error } = await MediaUtils.downloadVideo(url);
    if (error) return { path: undefined, error };
    const moveResult = await moveToDownloads(data);
    if (moveResult.error) return { path: undefined, error: moveResult.error };
    return { path: moveResult.path, error: undefined };
  }

  /**
   * @param {string} url
   * @returns {Promise<{path?: string, error?:unknown}>}>}
   */
  static async getAudio(url) {
    const { data, error } = await MediaUtils.downloadAndConvertToMp3(url);
    if (error) return { path: undefined, error };
    const moveResult = await moveToDownloads(data);
    if (moveResult.error) return { path: undefined, error: moveResult.error };
    return { path: moveResult.path, error: undefined };
  }

  /**
   * @param {string} url the video to transcribe
   * @param {string} apiKey your openai API key to get a whisper completion
   * @returns {Promise<{transcript?: string, error?:unknown}>}>}
   */
  static async getTranscription(url, writeToFile = false) {
    if (!Youtils.__openai)
      throw new Error("Must initialize openai before using transcriptions... ");
    const { error, path } = await Youtils.getAudio(url);
    if (error)
      return console.error("Failed to transcribe audio: ", error) || { error };

    const transcript = await MediaUtils.transcribeAudio(Youtils.__openai, path);
    if (!transcript)
      return console.error("Failed to get transcript") || { error };

    if (writeToFile) {
      const transcriptPath = path.replace(".mp3", ".txt");
      await writeFile(transcriptPath, transcript);
      console.log("Wrote transcript to: ", transcriptPath);
      console.log("Preview: \n" + transcript.substring(0, 255) + "...");
    }

    return { transcript };
  }
}
module.exports = { Youtils };
