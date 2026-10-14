// Short game sounds, made in the browser (no audio files).
// They only play when Sound is on in Settings (on by default).
// Usage: Sounds.play("correct" | "wrong" | "gallop" | "word" | "win" | "lose" | "buzz")
(function () {
  const SOUND_KEY = "private-space-sound";
  let ctx = null;

  function enabled() {
    try { return JSON.parse(localStorage.getItem(SOUND_KEY)) !== false; } catch (e) { return true; }
  }

  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // One soft note: type, pitch (Hz), start offset and length (seconds), volume.
  function note(a, { type = "triangle", freq, at = 0, len = 0.15, vol = 0.12, slideTo }) {
    const t = a.currentTime + at;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, t + len);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(gain).connect(a.destination);
    osc.start(t);
    osc.stop(t + len + 0.02);
  }

  const SOUNDS = {
    // Right answer: two rising notes.
    correct: (a) => { note(a, { freq: 660, len: 0.12 }); note(a, { freq: 880, at: 0.1, len: 0.18 }); },
    // Wrong answer: one low, gentle note (not a harsh buzzer).
    wrong: (a) => note(a, { freq: 300, slideTo: 240, len: 0.25, vol: 0.09 }),
    // Horses moving: a few soft hoof clops.
    gallop: (a) => [0, 0.11, 0.3, 0.41, 0.6, 0.71].forEach((at, i) =>
      note(a, { type: "square", freq: i % 2 ? 190 : 230, at, len: 0.05, vol: 0.05 })),
    // Crossword word completed: a short sparkle.
    word: (a) => [784, 988, 1175].forEach((freq, i) => note(a, { freq, at: i * 0.07, len: 0.14, vol: 0.09 })),
    // Win: a little rising tune.
    win: (a) => [523, 659, 784, 1047].forEach((freq, i) => note(a, { freq, at: i * 0.13, len: i === 3 ? 0.45 : 0.16 })),
    // Lose: a calm falling tune, not a sad trombone.
    lose: (a) => [523, 440, 392].forEach((freq, i) => note(a, { freq, at: i * 0.18, len: 0.25, vol: 0.09 })),
    // Phone vibrating in a pocket (intro).
    buzz: (a) => [0, 0.5].forEach((at) => note(a, { type: "sawtooth", freq: 140, at, len: 0.36, vol: 0.06 })),
  };

  function play(name) {
    if (!enabled() || !SOUNDS[name]) return;
    const a = audio();
    if (a) SOUNDS[name](a);
  }

  window.Sounds = { play, enabled, KEY: SOUND_KEY };
})();
