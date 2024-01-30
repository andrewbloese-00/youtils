# Youtils
Download videos, playlists and audio with urls, all in NodeJS. Also , use your OpenAI API Key to enable the Youtils transcriptions API. 


## Usage
### Install and Include
Download the youtils repository into your project, then to access it simply import the Youtils Utility Class to interface with the API. 

```javascript
const Youtils = require("youtils") // require("youtils/index.js");
```

### Download Video
```javascript
const { path , error } = await Youtils.getVideo("<some-youtube-url>");
```

### Download Audio 
```javascript
const {path,error} = await Youtils.getAudio("<some-youtube-url>");
```

### Transcribe A Video 
```javascript
const OPENAI_KEY = "<enter-your-api-key>"
const { transcripton , error } = await Youtils.getTranscription("<some-youtube-url>", OPENAI_KEY);
console.log("transcription: ", transcription); 


```


## Coming Soon ✨✨
- download entire playlists as mp4 or mp3







