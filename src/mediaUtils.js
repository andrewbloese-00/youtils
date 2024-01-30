const ytdl = require("ytdl-core")
const ffmpeg = require("ffmpeg")

const { createWriteStream , unlink, readFile, read, createReadStream }  = require("fs")




const DL_PATH = `${__dirname}/tmp`

const getVideoId = url => url.split("v=").pop().split("&")[0]

/**
 * @about NEVER 'rejects' see return
 * @param {string} pathToMp4 the path to the mp4 file to extract audio from
 * @param {Boolean} removeSrc should the original mp4 file be deleted? 
 * @returns {Promise<{data?:string, error?:unknown}>} data: 'path/to/<videoId>.mp4'|undefined, error:<error message> | undefined  
 */
const downloadVideo = url => new Promise((resolve) =>{
    const videoId = getVideoId(url);

    const destinationPath = `${DL_PATH}/${videoId}.mp4`;
    const destination = createWriteStream(destinationPath);

    //filter for mp4 formats with audio
    const filter = fmt => fmt.hasAudio && fmt.container == "mp4";
    ytdl(url,{filter})
        .pipe(destination)
            .on("finish", ()=>{
                resolve({data:destinationPath,error:undefined})
            })
            .on("error",(err)=>{
                console.warn("Error in mediaUtils.downloadVideo")
                console.error(err)
                resolve({data:undefined,error:err})
            })
})


/**
 * @about NEVER 'rejects' see return
 * @param {string} pathToMp4 the path to the mp4 file to extract audio from
 * @param {Boolean} removeSrc should the original mp4 file be deleted? 
 * @returns {Promise<{data?:string, error?:unknown}>} data: 'path/to/<videoId>.mp3'|undefined, error:<error message> | undefined  
 */
const convertToMp3 = ( pathToMp4 , removeSrc=false) => new Promise((resolve)=>{
    const process = new ffmpeg(pathToMp4,(err,video)=>{
        if(err){ 
            console.warn("failed to initialize ffmpeg in mediaUtils.convertToMp3")
            console.error(err)
            return resolve({data:null,error:undefined})
        }
        const destinationPath  = pathToMp4.replace(".mp4",".mp3")
        video.fnExtractSoundToMP3(destinationPath,(err,file)=>{
            if(err) return resolve({data:null,error:err});
            if(removeSrc){
                unlink(pathToMp4,(err)=>{
                    if(err) console.error(`failed to remove file '${pathToMp4}'`)
                })
            } 
            return resolve({data:destinationPath,error:undefined});
        })
    })
})




/**
 * @about NEVER 'rejects' see return
 * @param {string} url the url of the youtube video to download and convert
 * @returns { Promise<{data?:string,error?:unknown}>} data: 'path/to/<videoId>.mp3'|undefined, error: any errors that occurred | undefined
 */
async function downloadAndConvertToMp3(url){
    const downloadResult = await downloadVideo(url)
    if(downloadResult.error){
        console.warn("failed to download video, stoping downloadAndConvertToMp3")
        return { error: downloadResult.error, data: undefined}
    }

    const { data , error } = await convertToMp3(downloadResult.data, true)
    if(error){ 
        console.warn("failed to convert video, stoping downloadAndConvertToMp3")
        return { error: error, data: undefined}
    }

    return { data , error: undefined }
    
}

/**
 * 
 * @param {string} pathToFile the path to file to get bytes buffer
 * @returns {Promise<null|Buffer>}
 */
const getFileBuffer = (pathToFile)=> new Promise((resolve)=>{
    readFile(pathToFile,(err,data)=>{
        
        if(err){
            console.error("Failed to read file buffer from file:" , pathToFile)
            return resolve(null)
        }
        resolve(data) //return the buffer
    })
})  
const getFileStream = pathToFile => createReadStream(pathToFile)





module.exports = { 
    downloadAndConvertToMp3, downloadVideo, convertToMp3,getFileBuffer, getFileStream
}





