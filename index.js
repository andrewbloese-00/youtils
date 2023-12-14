const { downloadVideo , convertToMp3, downloadAndConvertToMp3  } = require("./utils")
const { getPlaylistInfo } = require("./scraper")
const { promises: { readFile , writeFile, rename}, write } = require("fs")
// const axios = require("axios").default
const fetch = require("node-fetch").default

const NodeID3 = require("node-id3")

function youtils(){
    
    async function scrapeAndDownloadPlaylist(linkToPlaylist){
        const playlistInfo = await getPlaylistInfo(linkToPlaylist)
        let q = [] 
        for(let i = 0; i < playlistInfo.length; i++){
            q.push(downloadAndConvertToMp3(playlistInfo[i].href));
        }

        const convertedVideos = await Promise.allSettled(q)
        for(let j = 0; j < convertedVideos.length; j++){
            if(convertedVideos[j].status === "fulfilled" && !convertedVideos[j].value.error){
                const {href, ...options } = playlistInfo[j]
                const id3Applied = await applyID3(convertedVideos[j].value.resolved,options)
                console.log(id3Applied ? "ID3 Tags applied successfully": "Failed to apply ID3 Tags");
            }
        }

    }
    return { scrapeAndDownloadPlaylist}
}

/**
 * @typedef {{
 *  title: string, 
 *  artist: string, 
 *  album: string, 
 *  APIC: string, 
 *  TRCK: string
 * }}ID3Tags
 */

/**
 * 
 * @param {string} pathToMp3 a path to an mp3 file to apply ID3 tags to. 
 * @param {{ID3Tags}} tags 
 * @about Please note that the the APIC is not currently working. Hoping to fix soon :P
 * @returns 
 */
async function applyID3(pathToMp3,tags){
    try {
        const id = pathToMp3.split("/").pop().split(".")[0]
        const buffer = await readFile(pathToMp3);
        const fimg = await fetch(tags.APIC)
        const apicBuffer = Buffer.from(await fimg.arrayBuffer())
        tags.APIC = {
            imageBuffer: apicBuffer
        }

        console.log(tags)


        const newBuffer = NodeID3.write(tags, buffer);    
        await writeFile(pathToMp3,newBuffer)
        console.log(id)
        await rename(pathToMp3,pathToMp3.replace(id,tags.title))

        return true
    } catch (error) {
        console.warn("ID3 application failed.");
        console.error(error);
        return false
    }

    

}




module.exports = youtils