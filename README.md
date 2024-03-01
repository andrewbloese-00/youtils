# Youtils

Download videos, playlists and audio from youtube with urls, all in NodeJS. Also , use your OpenAI API Key to enable the Youtils transcriptions API (powered by whisper-1).

## Usage

### Install and Include

Download the youtils repository into your project, then to access it simply import the Youtils Utility Class to interface with the API.

```javascript
const Youtils = require("youtils"); // require("youtils/index.js");
```

### Download Video

```javascript
const { path, error } = await Youtils.getVideo("<some-youtube-url>");
```

### Download Audio

```javascript
const { path, error } = await Youtils.getAudio("<some-youtube-url>");
```

### Transcribe A Video

```javascript
//initialize openai client
Youtils.initOpenAI("<enter-your-api-key>");
//get a transcript without writing to file
const { transcripton, error } =
  await Youtils.getTranscription("<some-youtube-url>");

//get a transcript and write it to a text file
const { transcripton, error } = await Youtils.getTranscription(
  "<some-youtube-url>",
  true,
);
```

### Download the Audio from a Playlist

```javascript
const playlist_url = "<url to some youtube playlist>";
const paths = await Youtils.downloadPlaylistAudio(playlist_url);
//saves all the audio from the provided playlist into a timestamped folder in the Downloads Directory, returns the paths to all the audio files
```

### Transcribe a Playlist

```javascript
//initialize openai client
Youtils.initOpenAI("<enter openai key>");
const playlist_url = "<url to some youtube playlist>";
await Youtils.transcribePlaylist(playlist_url);
//saves all the transcripts from the provided playlist into a timestamped folder in the Downloads Directory as text files for each video
```

### CLI

To use the CLI with transcriptions, create a `.env` file in the `youtils/` root folder, and create an environment variable `OPENAI_SECRET_KEY` set to your OpenAI access token. Downloads are available without openai integrations!

#### CLI Usage

node Youtils/cli.js [ -v | -a | -t | -pa | -pt ] [youtube url]
-v -> download video
-a -> download audio
-t -> transcribe video
-pa -> download audio from playlist
-pt -> transcribe a playlist
