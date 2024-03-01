#!/usr/bin/env node
require("dotenv").config();
const Youtils = require("./index");
if (process.env.OPENAI_SECRET_KEY)
  Youtils.initOpenAI(process.env.OPENAI_SECRET_KEY);

function printUsage() {
  const lines = [
    "Youtils CLI Usage: ",
    "node Youtils/cli.js [ -v | -a | -t | -pa | -pt ] [youtube url]",
    "\t-v -> download video",
    "\t-a -> download audio",
    "\t-t -> transcribe video",
    "\t-pa -> download playlist audio",
    "\t-pt -> transcribe playlist ",
  ];
  console.log(lines.join("\n"));
}
function FATAL_ERR() {
  console.error("[FATAL] Invalid Usage");
  printUsage();
  process.exit(1);
}

function ACTION_ERR(msg) {
  console.error("[ERROR] ", msg);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);

  //validate args
  if (args.length < 2) FATAL_ERR();
  //determine action
  switch (args[0].trim()) {
    case "-v": {
      const { error, path } = await Youtils.getVideo(args[1]);
      if (error) ACTION_ERR(error);
      console.log("Downloaded video to: ", path);
      break;
    }

    case "-a": {
      const { error, path } = await Youtils.getAudio(args[1]);
      if (error) ACTION_ERR(error);
      console.log("Downloaded audio to: ", path);
      break;
    }

    case "-t": {
      const { error } = await Youtils.getTranscription(args[1], true);
      if (error) ACTION_ERR(error);
      break;
    }

    case "-pa": {
      await Youtils.downloadPlaylistAudio(args[1]);
      break;
    }

    case "-pt": {
      await Youtils.transcribePlaylist(args[1]);
      break;
    }

    default:
      FATAL_ERR();
  }
}

main();
