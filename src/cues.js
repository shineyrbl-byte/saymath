// Short sounds while exploring, so moving through an equation can be felt
// without words: a rising pair going into a part, a falling pair coming out,
// a click moving along, and a low buzz (plus a vibration on phones) at an edge.
let ctx = null;

function tone(freq, start, length, volume = 0.08) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(volume, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + length + 0.02);
}

export function cue(kind) {
  if (kind === 'edge' && navigator.vibrate) navigator.vibrate(60);
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = ctx || new AC();
    if (kind === 'in') { tone(520, 0, 0.07); tone(780, 0.07, 0.08); }
    else if (kind === 'out') { tone(780, 0, 0.07); tone(520, 0.07, 0.08); }
    else if (kind === 'move') tone(660, 0, 0.05, 0.05);
    else if (kind === 'edge') tone(180, 0, 0.18, 0.1);
  } catch { /* no audio: words still work */ }
}
