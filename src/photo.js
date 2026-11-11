// Reads maths from a photo (a printed or handwritten worksheet) with Claude,
// and turns it into SayMath's typed maths, one question per item.
//
// This is the only part of SayMath that uses the internet and sends data
// anywhere: the photo goes from the learner's device straight to Anthropic,
// using the learner's (or teacher's) own API key. Nothing goes through a
// SayMath server, because there isn't one.

import { parse } from './parser.js';

export const MODEL = 'claude-opus-5-5';
// Pinned, and loaded only when a photo is read, so the rest of the app stays offline.
const SDK_URL = 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.8.0/+esm';

const SYNTAX = `Write each piece of maths in this plain-text syntax:
- powers x^2, x^(n+1); fractions (a+b)/(c+d) with brackets around multi-part tops and bottoms; implicit multiplication 3x
- sqrt(x), root(3, x), abs(x) or |x|, n!, x_1 for subscripts
- sin cos tan log ln, log_2(8), asin acos atan, sinh cosh tanh
- pi theta alpha beta (Greek letters by name), infinity
- = < > <= >= != and ~= for approximately equal, +/- for plus or minus, 30° for degrees
- sum(i=1, n, i^2), prod(k=1, n, k), int(x^2, x) and int(x^2, x, 0, 1) for integrals (body, variable, lower, upper)
- lim(x -> 0, sin(x)/x), diff(x^3, x) and diff(y, x, 2) for derivatives, [[1, 2], [3, 4]] for matrices, det([[1, 2], [3, 4]])`;

export const SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      description: 'Every maths question or expression in the photo, in reading order.',
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'The instruction words for this question, like "Solve for x", exactly as written. Empty if none.' },
          math: { type: 'string', description: 'The maths, in the plain-text syntax.' },
          unsure: { type: 'boolean', description: 'True if any part was hard to read, so a person should check it.' },
        },
        required: ['prompt', 'math', 'unsure'],
        additionalProperties: false,
      },
    },
    note: { type: 'string', description: 'One short sentence for the learner if something could not be read, else empty.' },
  },
  required: ['items', 'note'],
  additionalProperties: false,
};

export function buildRequest({ imageBase64, mediaType }) {
  return {
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
    // If the model declines, the API retries on a fallback model in the same call.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: `You transcribe maths from photos of worksheets, textbooks and whiteboards for blind and low-vision students, whose screen reader will read your transcription aloud. Accuracy matters more than anything: copy what is written, do not solve or correct it, and mark an item unsure rather than guess. Keep question numbers out of the maths.\n\n${SYNTAX}`,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
        { type: 'text', text: 'Transcribe every maths question or expression in this photo.' },
      ],
    }],
  };
}

export class PhotoError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Checks Claude's answer and marks lines SayMath can't read, so the person can fix them.
export function readResponse(response) {
  if (response.stop_reason === 'refusal') throw new PhotoError('refused', 'The photo could not be read.');
  if (response.stop_reason === 'max_tokens') throw new PhotoError('tooLong', 'There was too much on the photo. Try a photo of fewer questions.');
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  let data;
  try { data = JSON.parse(text); } catch { throw new PhotoError('badReply', 'The reply could not be understood. Please try again.'); }
  const items = data.items.map((it) => {
    let error = null;
    try { parse(it.math); } catch (e) { error = e; }
    return { prompt: it.prompt.trim(), math: it.math.trim(), unsure: Boolean(it.unsure), error };
  }).filter((it) => it.math);
  return { items, note: data.note || '' };
}

async function defaultClient(apiKey) {
  const { default: Anthropic } = await import(SDK_URL);
  // The key is the learner's own and goes only to api.anthropic.com.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export async function readPhoto({ apiKey, imageBase64, mediaType }, makeClient = defaultClient) {
  if (!apiKey) throw new PhotoError('noKey', 'Paste an Anthropic API key first.');
  let client;
  try { client = await makeClient(apiKey); } catch { throw new PhotoError('offline', 'Could not connect. Reading a photo needs the internet.'); }
  let response;
  try {
    response = await client.beta.messages.create(buildRequest({ imageBase64, mediaType }));
  } catch (e) {
    const status = e && e.status;
    if (status === 401 || status === 403) throw new PhotoError('badKey', 'That API key was not accepted.');
    if (status === 429) throw new PhotoError('busy', 'Too many requests right now. Wait a minute and try again.');
    if (status === 400) throw new PhotoError('badImage', 'That image could not be used. Try a JPG or PNG photo.');
    throw new PhotoError('offline', 'Could not connect. Reading a photo needs the internet.');
  }
  return readResponse(response);
}

// Shrinks a photo to at most 1568 pixels on its long side (what the model
// uses anyway), as JPEG, so it uploads quickly on a slow connection.
export async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1568 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
  return { imageBase64: dataUrl.slice(dataUrl.indexOf(',') + 1), mediaType: 'image/jpeg', preview: dataUrl };
}
