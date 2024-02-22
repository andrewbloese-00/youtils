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
//initialize openai client
Youtils.initOpenAI("<enter-your-api-key>");
//get a transcript without writing to file
const { transcripton , error } = await Youtils.getTranscription("<some-youtube-url>");

//get a transcript and write it to a text file
const { transcripton , error } = await Youtils.getTranscription("<some-youtube-url>",true);
```

### CLI
node Youtils/cli.js [ -v | -a | -t ] [youtube url]
	-v -> download video
	-a -> download audio
	-t -> transcribe video


## Coming Soon ✨✨
- download entire playlists as mp4 or mp3
