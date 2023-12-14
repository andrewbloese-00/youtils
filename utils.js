require('dotenv').config()
const ytdl = require("ytdl-core")
const ffmpeg = require("ffmpeg")
const {createWriteStream } = require("fs")
const { unlink } = require("fs/promises")
const logger = require("./logger")();
const DOWNLOADS_PATH = `${__dirname}/tmp`

/**
 * 
 * @param {string} url url of the video to download
 * @returns the path to the mp4 file of the video downloaded from provided youtube url. Wrapper around ytdl 
 */
const downloadVideo = url => new Promise((resolve,reject)=>{
        const videoId = url.split("v=").pop().split("&")[0]
        const dstPath = `${DOWNLOADS_PATH}/${videoId}.mp4`
        console.log(dstPath)
        const destination = createWriteStream(dstPath)
        //get mp4 stream with audio, download to 'destination' and resolve it
        ytdl(url,{filter: fmt=>fmt.hasAudio && fmt.container === "mp4"})
            .pipe(destination)
                .on("finish",()=>{ //notify success and resolve
                    logger.log("Downloaded video " + videoId + " to " + dstPath);
                    resolve(dstPath);
                })
                .on("error",(err)=>{ //notify err and reject
                    logger.warn("Failed to download video: " + videoId)
                    logger.error(err)
                    reject(err)
                })

})

/**
 * 
 * @param {string} pathToMp4 the path to the mp4 file to convert into an mp3
 * @about resolves with the path to the created mp3 file or with an error message if conversion failed.
 */
const convertToMp3 = (pathToMp4) => new Promise((resolve,reject)=>{
    console.log('convert recieved: ', pathToMp4)
    const process = new ffmpeg(pathToMp4,(err,video)=>{
        if(err){
            console.warn("Could not start ffmpeg:");
            console.error(err)
            return 
        } 
        const dst = pathToMp4.replace(".mp4",".mp3");
        video.fnExtractSoundToMP3(dst,(err,file)=>{
            if(err) {
                console.warn("Could not convert to mp3: ")
                console.error(err);
                return reject(err);
            }
            console.log("Successfully converted to mp3: ", file)
            resolve(dst);
        })
    }) //end ffmpeg
})


/**
 * @param {string} url the url of the youtube video to download and convert to mp3
 * @about downloads the mp4 of a youtube video, then uses ffmpeg to convert it into an mp3 file, finally deleting the mp4 file and returning the path to the mp3 file.
 * @returns { {resolved?: string,  error?: string }} "resolved" -> the path to where the mp3 was downloaded, "error" -> a message describing the error (if any)
  */
const downloadAndConvertToMp3 = async (url)=>{
    let mp4Path, mp3Path;
    try {
        mp4Path = await downloadVideo(url);
    } catch (error) {
        console.warn("Caught in downloading: ")
        console.log(error)
        return { error: error.message || error}
    }

    if(!!mp4Path){
        try {
            mp3Path = await convertToMp3(mp4Path);
            await unlink(mp4Path);
            return { resolved: mp3Path}
            
        } catch (error) {
            console.warn("Caught in converting:")
            console.error(error)
            return { error: error.message || error } 
        }

    }
    return { error: "Failed to execute download and convert with url="+url }
}


// BROKEN - needs attention
// async function transcribeYoutube(url){
//     const pathToMp3 = await downloadAndConvertToMp3(url);
//     if(pathToMp3.error) {
//         logger.err(pathToMp3.error);
//         return { error: pathToMp3.error}
//     }
//     const fileBuffer = await readFile(pathToMp3.resolved)
//     const {text, error } = await transcriptionCompletion(fileBuffer)
//     if(error){
//         logger.error(error)
//         return { error }
//     }
//     await writeFile(pathToMp3.resolved+".txt", text)
//     logger.info(`Wrote transcription of ${pathToMp3.resolved} to ${pathToMp3.resolved}.txt`);

// }


/* TEST 1, manually download and convert multiple videos given links
const TEST_URLS  = ["https://www.youtube.com/watch?v=l-ufAnjtw7I&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=1&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=ul7u6ZfAaYw&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=2&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=65FP5iE_mvc&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=3&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=5l-NAUNV950&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=4&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=Umz_9kNRoz4&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=5&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=NlZVDmHSnuc&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=6&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=_tHTqWHu4_A&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=7&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=bku_dzwosRk&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=8&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=VgxBTJa9IAU&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=9&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=g37s4pn0WRs&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=10&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=EB9uDSHmCHs&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=11&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=Kddtdk6TpmY&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=12&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=iDVKMdnvgl8&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=13&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=mB04GKIhmCA&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=14&pp=gAQBiAQB8AUB","https://www.youtube.com/watch?v=hOOp32c9lM0&list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV&index=15&pp=gAQBiAQB8AUB"]

async function test(){
    let  q = [] 
    for(let i = 0; i < TEST_URLS.length; i++){
        q.push(downloadAndConvertToMp3(TEST_URLS[i]));
    }

    let resolved = await Promise.all(q)
    console.log(resolved)
}
test(); */







module.exports = { downloadVideo, convertToMp3, downloadAndConvertToMp3 }