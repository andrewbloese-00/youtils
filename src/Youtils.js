const MediaUtils = require("./mediaUtils");
const { rename, mkdir } = require("fs/promises");
const { homedir } = require("os");
const { join } = require("path");
const { OpenAI } = require("openai");
const { writeFile, unlink } = require("fs/promises");
const { getPlaylistInfo } = require("./scraper");

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
  static async getAudio(url, cleanup = true) {
    const { data, error } = await MediaUtils.downloadAndConvertToMp3(
      url,
      cleanup,
    );
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
  static async getTranscription(url, writeToFile = false, cleanup = true) {
    if (!Youtils.__openai)
      throw new Error("Must initialize openai before using transcriptions... ");
    const { error, path } = await Youtils.getAudio(url, cleanup);
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
    if (cleanup) await unlink(path);

    return { transcript };
  }

  static async downloadPlaylistAudio(playlistUrl) {
    let q = [];
    const dirTitle = `youtils-playlist-download-${Date.now()}`;
    const playlist = await getPlaylistInfo(playlistUrl);
    for (let p = 0; p < playlist.length; p++) {
      console.log(`Downloading ${playlist[p].title}...`);
      console.time(`Download ${playlist[p].title}`);
      q.push(Youtils.getAudio(playlist[p].href));
    }

    /**@type {string[]} */
    const moves = [];
    await mkdir(`${getUserDownloadsPath()}/${dirTitle}`);

    const results = await Promise.allSettled(q);
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === "fulfilled" && !results[i].value.error) {
        //rename to video name
        let tmp = results[i].value.path.split("/");
        tmp.pop();
        tmp.push(`${playlist[i].title}.mp3`);
        const newName = tmp.join("/");
        await rename(results[i].value.path, newName);
        moves.push(newName);
        console.timeEnd(`Download ${playlist[i].title}`);
      } else {
        console.timeEnd(`Download ${playlist[i].title}`);
        console.warn(`Rejection on queue item at index '${i}'`);
        console.error(results[i].reason || results[i].value.error);
      }
    }

    const paths = [];
    q = [];
    for (let i = 0; i < moves.length; i++) {
      let segments = moves[i].split("/");
      const n = segments.length;

      segments = [...segments.slice(0, n - 1), dirTitle, segments.at(-1)];
      const newName = segments.join("/");
      q.push(rename(moves[i], newName));
      paths.push(newName);
    }
    await Promise.allSettled(q);
    console.log("Finished Saving Playlist to: ", `Downloads/${dirTitle}`);
    return paths;
  }

  static async transcribePlaylist(playlistUrl) {
    const playlist = await getPlaylistInfo(playlistUrl);
    const pathToPlaylist = `${getUserDownloadsPath()}/youtils-playlist-transcription-${Date.now()}`;
    await mkdir(pathToPlaylist);
    for (let i = 0; i < playlist.length; i++) {
      console.log("Transcribing video: ", playlist[i].title);
      console.time("Transcribe " + playlist[i].title);
      const { transcript, error } = await Youtils.getTranscription(
        playlist[i].href,
        false,
        true,
      );
      if (error) {
        console.warn(`Failed to transcribe ${playlist[i].title}...`);
        console.error(error);
      } else {
        await writeFile(
          `${pathToPlaylist}/${playlist[i].title}.txt`,
          transcript,
          "utf8",
        );
      }
      console.timeEnd("Transcribe " + playlist[i].title);
    }
  }
}
module.exports = { Youtils };
