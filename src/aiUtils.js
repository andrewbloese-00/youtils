//aiUtils - wrapper for openai whisper-1 completion

const { default: OpenAI } = require("openai");

/**
 *
 * @param {ReadableStream} mp3ReadStream
 * @param {OpenAI} openai
 * @returns {Promise<{error?:unknown, data:string}}
 */
async function transcriptionCompletion(mp3ReadStream, openai) {
  try {
    const { text } = await openai.audio.transcriptions.create({
      file: mp3ReadStream,
      model: "whisper-1",
    });
    return { text, error: undefined };
  } catch (error) {
    return { text: undefined, error };
  }
}

const summarizer_system_msg =
  "You are a helpful summarizer who will provide a summary of the text provided by the user, ensuring no information is duplicated.Do not leave out important examples or data.";
const notes_sys_msg =
  "You are a helpful note-taker, you will take any information the user provides and generate well structured notes on the subjects involved. Use markdown syntax, ensure maximum relevant information is shown, and draw relationships between topics. Use markdown tables for relevant tabular data if applicable.";

const MAX_SUMMARIZER_DEPTH = 3; //how many times can the summarizer summarizer itself

/**
 * @param {OpenAI} openai
 * @param {string} text the text to summarize
 */
export async function summarize(openai, text, d = 0) {
  const sentences = getSentences(text);
  const textWindows = windowSentences(sentences, 2000);
  const q = [];
  let notes = "";
  //base cases - one window || max depth
  if (textWindows.length == 1 || d > MAX_SUMMARIZER_DEPTH) {
    for (let w = 0; w < textWindows.length; w++) {
      q.push(
        openai.chat.completions.create({
          model: "gpt-3.5-turbo-0301",
          messages: [{ role: "system", content: notes_sys_msg }],
        }),
      );
    }
    (await Promise.allSettled(q)).forEach((result) => {
      if (result.status === "fulfilled") {
        notes += "\n" + result.value.choices[0].message.content;
      }
    });
    return notes;
  } else {
    //recursive case
    for (let w = 0; w < textWindows.length; w++) {
      q.push(
        openai.chat.completions.create({
          model: "gpt-3.5-turbo-0301",
          messages: [{ role: "system", content: summarizer_system_msg }],
        }),
      );
    }
  }
}

module.exports = { transcriptionCompletion };
