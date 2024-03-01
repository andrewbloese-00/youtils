const { getPlaylistInfo } = require("../src/scraper");
getPlaylistInfo(
  "https://www.youtube.com/playlist?list=PLHGgDEW_R5sE-89rRZs7jKv5XZS-h4BAV",
).then(console.log);
