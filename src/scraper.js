const puppeteer = require("puppeteer");
const ytdl = require("ytdl-core");
const PUPPETEER_OPTS = { headless: "new"}

/**
 * 
 * @param {unknown} err 
 * @returns {{error: string, reason: unknown}}
 */
const SCRAPER_INIT_ERR = ( err ) => { 
    let msg = "Failed to initialize the scraper. "
    console.warn(msg);
    console.error(err);
    return { error: msg , reason: err};
} 
/**
 * 
 * @param {unknown} err 
 * @param {string|undefined} url
 * @returns {{error: string, reason: unknown}}
 */
const SCRAPE_ERROR = ( err, url=undefined ) => {
    const msg = url ? "Failed to scrape the page." : `Failed to scrape the page at ${url}`
    console.warn(msg);
    console.error(err);
    return { error: msg, reason: err } 
}



async function initScraper(){
    /**@type {puppeteer.Browser} */ 
    let browser;
    /**@type {puppeteer.Page} */ 
    let page; 
    let c = 0; 
    try {
        browser = await puppeteer.launch(PUPPETEER_OPTS);
        page = await browser.newPage();
    } catch (error) {
        return SCRAPER_INIT_ERR(error);
    }

    const wait = (ms)=>new Promise(resolve=> setTimeout(resolve,ms));
    async function scrape(url,evaluator){
        try {
            if(c > 5){
                await page.close()
                c = 0;
                page = await browser.newPage();
            }
            await page.goto(url);
            await wait(3000);
            
            const result = await page.evaluate(evaluator)
            c++; 
            return result;
        } catch (error) {
            return SCRAPE_ERROR(error,url);
        }

    }
    async function close( ){
        c = 0; 
        await page.close();
        await browser.close();

    } 


    return { 
        scrape, close
    }



} 
/**
 * @about a callback that scrapes the link and title of all the videos in a youtube playlist given a link to the playlist; 
 * @returns {{title:string,href:string}[]} an array of the videos found on the youtube playlist page
 */
function scrapeVidsFromPlaylist(){
    let results = []
    const videos = Array.from(document.querySelectorAll("ytd-playlist-video-renderer"))
    for(const video of videos){
        const link = video.querySelector("a#video-title")
        const title = link.textContent.trim() || "undefined";
        const href = link.href || "undefined";
        results.push({
            title,href
        })
    }
    return results
}



//testing the usage of scrapeVids function 
async function getPlaylistInfo(playlistUrl){
    const scraper = await initScraper();
    if(scraper.error) return scraper.error ;
    const results = await scraper.scrape(playlistUrl, scrapeVidsFromPlaylist)
    await scraper.close()

    let q = [] 
    for(let result of results){
        q.push(ytdl.getInfo(result.href));
    }
    const resolved = await Promise.all(q)
    for(let i = 0; i < results.length; i++){
        results[i]['album'] = `Youtube Downloaded ${new Date().toDateString()}`
        results[i]['artist'] = resolved[i].videoDetails.author.name;
        results[i]['APIC'] = resolved[i].videoDetails.thumbnails[0].url
        // results[i]['durationMS'] = resolved[i].videoDetails.lengthSeconds*1000
        results[i]['TRCK'] = i+1
    }
    return results
}



// const PL = "https://www.youtube.com/playlist?list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV"

module.exports = { getPlaylistInfo }