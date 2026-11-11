// Reading maths from a photo: the request sent to Claude, and how the reply is checked.
// Uses a stand-in client, so no API key or network is needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readPhoto, buildRequest, readResponse, PhotoError, MODEL } from '../src/photo.js';

const reply = (data, stop = 'end_turn') => ({ stop_reason: stop, content: [{ type: 'text', text: JSON.stringify(data) }] });

test('the request: the photo, a JSON schema for the answer, and refusal fallback', () => {
  const r = buildRequest({ imageBase64: 'AAAA', mediaType: 'image/jpeg' });
  assert.equal(r.model, MODEL);
  assert.equal(r.messages[0].content[0].type, 'image');
  assert.deepEqual(r.messages[0].content[0].source, { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' });
  assert.equal(r.output_config.format.type, 'json_schema');
  assert.equal(r.fallbacks, 'default');
  assert.ok(!('thinking' in r) && !('temperature' in r));
});

test('a reply becomes questions; lines SayMath cannot read are flagged', () => {
  const out = readResponse(reply({ items: [
    { prompt: 'Solve for x', math: '3x - 4 = 11', unsure: false },
    { prompt: '', math: '(x + 1', unsure: true },
    { prompt: '', math: '  ', unsure: false },
  ], note: '' }));
  assert.equal(out.items.length, 2);
  assert.equal(out.items[0].error, null);
  assert.equal(out.items[1].error.code, 'unclosed');
  assert.equal(out.items[1].unsure, true);
});

test('refusals and cut-off replies give clear errors', () => {
  assert.throws(() => readResponse({ stop_reason: 'refusal', content: [] }), (e) => e.code === 'refused');
  assert.throws(() => readResponse({ stop_reason: 'max_tokens', content: [] }), (e) => e.code === 'tooLong');
  assert.throws(() => readResponse({ stop_reason: 'end_turn', content: [{ type: 'text', text: 'not json' }] }), (e) => e.code === 'badReply');
});

test('readPhoto: needs a key, sends the request, explains API errors', async () => {
  await assert.rejects(readPhoto({ apiKey: '', imageBase64: 'A', mediaType: 'image/jpeg' }), (e) => e instanceof PhotoError && e.code === 'noKey');
  let sent;
  const fake = async (key) => ({ beta: { messages: { create: async (req) => { sent = { key, req }; return reply({ items: [{ prompt: '', math: 'x^2', unsure: false }], note: '' }); } } } });
  const out = await readPhoto({ apiKey: 'test-key', imageBase64: 'A', mediaType: 'image/jpeg' }, fake);
  assert.equal(sent.key, 'test-key');
  assert.equal(sent.req.model, MODEL);
  assert.equal(out.items[0].math, 'x^2');
  const failing = (status) => async () => ({ beta: { messages: { create: async () => { throw Object.assign(new Error('x'), { status }); } } } });
  await assert.rejects(readPhoto({ apiKey: 'k', imageBase64: 'A', mediaType: 'image/jpeg' }, failing(401)), (e) => e.code === 'badKey');
  await assert.rejects(readPhoto({ apiKey: 'k', imageBase64: 'A', mediaType: 'image/jpeg' }, failing(429)), (e) => e.code === 'busy');
});
