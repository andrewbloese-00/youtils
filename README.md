# Youtils
Download videos, playlists and audio with urls, all in NodeJS. Also , use your OpenAI API Key to enable the Youtils transcriptions API. 


## Usage
### Install and Include
Download the youtils repository into your project, then to access it simply import the Youtils Utility Class to interface with the API. 

```javascript
const Youtils = require("youtils") // require("youtils/index.js");
```

### Download Videos 
```javascript
const { path , error } = await Youtils.downloadVideo("<some-youtube-url>");
```

### Download Audio 
```javascript
const {path,error} = await Youtils.downloadAudio("<some-youtube-url>");
```










