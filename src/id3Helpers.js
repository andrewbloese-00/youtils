const { readFile, rename } = require("fs/promises");
const http = require("http");
const ytdl = require("ytdl-core");
const { join } = require("path");
const { homedir } = require("os");

const NodeID3 = require("node-id3").Promise;
const ffmeta = require("ffmetadata");
const { writeFile, createWriteStream } = require("fs");

function writeTags(pathToMp3, tags, options) {
  return new Promise((resolve) => {
    ffmeta.write(pathToMp3, tags, options, (err) => {
      if (err) {
        console.error(err);
        resolve(false);
      } else resolve(true);
    });
  });
}

const getUserDownloadsPath = () => join(homedir(), "Downloads");
/**
 * @param {string} url
 * @returns {Promise<{buffer?:Buffer, imageFetchError?:string}>}
 */
const getImageFromUrl = (url) =>
  new Promise((resolve) => {
    const artPath = `/Users/blaze/Development/favs/youtils/src/tmp/artwork/${Math.floor(Date.now() + Math.random() * Date.now() * (Math.random() > 0 ? -1 : 1))}.jpg`;
    // get the image
    http.get(url, (res) => {
      res
        .pipe(createWriteStream(artPath))
        .on("error", (err) => {
          console.error(err);
          resolve({ imageFetchError: err.message });
        })
        .on("close", () => {
          resolve({ artPath });
        });
    });
  });

/**
 * @param {string} imageUrl the url to the image to be fetched as the album artwork, automatically downloaded as buffer
 * @param {string} title the track title
 * @param {string} artist the artist of the track
 * @param {number} track the order of the track on the album (1-indexed)
 * @returns {Promise<Buffer>} the generated ID3 Buffer of the provided metadata. Note that image fetch failures are soft errors and do not stop the application of the other id3 tags!
 */
async function generateID3Tags(
  imageUrl,
  title,
  artist,
  album,
  track = undefined,
) {
  let tags = { title, artist, album };
  let options = {};
  let hasImg = true;
  const { artPath, imageFetchError } = await getImageFromUrl(imageUrl);
  if (imageFetchError) {
    hasImg = false;
    console.warn("Could not fetch image");
  }

  if (track) {
    tags["track"] = track;
  }
  if (hasImg) {
    options["attachments"] = [artPath];
  }

  return { tags, options };
}

//generate id3 based on the youtube video, use channel name as artist, thumbnail as album art, 'Youtube' as album, no trackNumber set
async function basicID3(youtubeUrl, pathToMp3) {
  try {
    const info = await ytdl.getInfo(youtubeUrl);
    // const mp3Buff = await readFile(pathToMp3);
    // console.log(JSON.stringify(info, null, 4));
    const { tags, options } = await generateID3Tags(
      info.videoDetails.thumbnails.length > 0
        ? info.videoDetails.thumbnails[0].url.replace("https", "http")
        : "http://placehold.it/300x300",
      info.videoDetails.title,
      info.videoDetails.author,
      "Youtils",
    );
    await writeTags(pathToMp3, tags, options);
    const newPath = `${getUserDownloadsPath()}/${info.videoDetails.title}.mp3`;
    await rename(pathToMp3, newPath);
    return newPath;
  } catch (error) {
    console.error(error);
    console.warn("Failure in basicID3");
  }
}

module.exports = { basicID3, getUserDownloadsPath };
