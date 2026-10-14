// Opening scene, played when the site opens on the phone's home screen:
// the character walks in, stops, the phone buzzes in his pocket, he takes it out,
// is surprised by the notification, and the real phone rises up in his hand.
// Starts with a button (so the buzz sound is allowed), and can always be skipped.
(function () {
  const lift = document.getElementById("lift");
  const IMG = "img/intro/";

  const replay = location.hash === "#intro";
  if (replay) history.replaceState(null, "", "#home.html");
  const onHome = replay || location.hash === "" || location.hash === "#home.html";
  let calm = false;
  try { calm = JSON.parse(localStorage.getItem("private-space-calm")) === true; } catch (e) { /* storage unavailable */ }
  // Plays every time the site is opened on the home screen. Calm mode skips it (it is all movement),
  // unless it is asked for directly with #intro.
  if (!onHome || (calm && !replay)) return;

  const style = document.createElement("style");
  style.textContent = `
    #intro { position: fixed; inset: 0; z-index: 100; background: #fff; overflow: hidden; font-family: 'Nunito', system-ui, sans-serif; }
    #intro .char { position: absolute; bottom: calc(14vh - 2px); height: min(56vh, 560px); image-rendering: pixelated; pointer-events: none; }
    #intro .char.shake { animation: introShake .12s linear infinite; }
    #intro .char.zoom { transform-origin: 80% 25%; /* where the phone is in surprised.png */ animation: introZoom .9s ease-in forwards; }
    @keyframes introZoom { to { transform: scale(5); opacity: 0; } }
    @keyframes introShake { 0%,100% { transform: translateX(0); } 50% { transform: translateX(3px); } }
    #intro .start { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 14px; text-align: center; color: #3a2f22; }
    #intro .start p { margin: 0; font-size: 15px; font-weight: 700; opacity: .7; }
    #intro button { font: 900 16px 'Nunito', system-ui, sans-serif; cursor: pointer; }
    #intro .play { padding: 14px 34px; border: 3px solid #000; border-radius: 14px; background: #1a1a1a; color: #fff; box-shadow: 0 5px 0 #000; }
    #intro .skip { position: absolute; top: 18px; right: 18px; padding: 10px 16px; border: 2px solid #3a2f22; border-radius: 999px; background: #fff; color: #3a2f22; }
    .lift .hand { position: absolute; z-index: 3; image-rendering: pixelated; pointer-events: none; }
    .lift.hidden { opacity: 0; }
    .lift.rise { animation: introRise 1s cubic-bezier(.2,.8,.3,1) both; }
    @keyframes introRise { from { opacity: 0; transform: scale(.55); } to { opacity: 1; transform: none; } }
    .lift .hand.leave { transition: transform .9s ease-in, opacity .9s ease-in; transform: translateY(70%); opacity: 0; }`;
  document.head.appendChild(style);

  // Preload every frame so nothing flickers.
  new Image().src = `${IMG}hand.webp`;
  const frames = ["walk-1", "walk-2", "walk-3", "walk-4", "walk-5", "walk-6", "buzz", "look", "surprised"];
  frames.forEach((f) => { new Image().src = `${IMG}${f}.png`; });

  const scene = document.createElement("div");
  scene.id = "intro";
  scene.innerHTML = `
    <img class="char" alt="" src="${IMG}walk-1.png" hidden>
    <div class="start">
      <button class="play" type="button">▶ Start</button>
      <p>Turn your sound on to hear the phone buzz.</p>
    </div>
    <button class="skip" type="button">Skip intro</button>`;
  document.body.appendChild(scene);
  const char = scene.querySelector(".char");
  lift.classList.add("hidden");

  // The hand from the intro art holds our real phone: the phone's edges sit under the thumb
  // and fingers, and its bottom is tucked behind the palm.
  // Numbers are positions in hand.webp (1089×1444) where the phone's edges go.
  const HAND = { w: 1089, phoneLeft: 225, phoneRight: 880, phoneBottom: 1070 };
  const hands = [];
  function addHands() {
    const k = lift.offsetWidth / (HAND.phoneRight - HAND.phoneLeft);
    const hand = new Image();
    hand.src = `${IMG}hand.webp`;
    hand.className = "hand";
    Object.assign(hand.style, {
      width: `${HAND.w * k}px`,
      left: `${-HAND.phoneLeft * k}px`,
      top: `${lift.offsetHeight - HAND.phoneBottom * k}px`
    });
    lift.append(hand);
    hands.push(hand);
  }

  let skipped = false;
  const wait = (ms) => new Promise((resolve, reject) => setTimeout(() => (skipped ? reject() : resolve()), ms));

  let audio = null;
  function buzz() {
    let soundOn = true;
    try { soundOn = JSON.parse(localStorage.getItem("private-space-sound")) !== false; } catch (e) { /* default on */ }
    if (!audio || !soundOn) return;
    // Two short, soft buzzes, like a phone vibrating in a pocket.
    const t = audio.currentTime;
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 380;
    filter.connect(audio.destination);
    [0, 0.5].forEach((start) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 140;
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(0.18, t + start + 0.02);
      gain.gain.setValueAtTime(0.18, t + start + 0.32);
      gain.gain.linearRampToValueAtTime(0, t + start + 0.36);
      osc.connect(gain).connect(filter);
      osc.start(t + start);
      osc.stop(t + start + 0.4);
    });
  }

  function walkIn(duration) {
    return new Promise((resolve, reject) => {
      const width = char.offsetWidth;
      const from = -width, to = (innerWidth - width) / 2;
      const begin = performance.now();
      function step(now) {
        if (skipped) { reject(); return; }
        const p = Math.min(1, (now - begin) / duration);
        char.style.left = `${from + (to - from) * p}px`;
        char.src = `${IMG}walk-${(Math.floor((now - begin) / 130) % 6) + 1}.png`;
        if (p < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }

  function finish() {
    scene.remove();
    hands.forEach((h) => h.remove());
    lift.classList.remove("hidden", "rise");
  }

  async function play() {
    scene.querySelector(".start").remove();
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
    char.hidden = false;
    try {
      await walkIn(3200);
      char.src = `${IMG}buzz.png`;          // stops; the phone buzzes in his pocket
      await wait(500);
      char.classList.add("shake");
      buzz();
      await wait(1000);
      char.classList.remove("shake");
      await wait(500);
      char.src = `${IMG}look.png`;          // takes the phone out and looks at it
      await wait(1300);
      char.src = `${IMG}surprised.png`;     // surprised by the notification
      await wait(1500);
      // Zoom in on the phone in his hand; it becomes the real phone, held in the hand.
      char.classList.add("zoom");
      await wait(800);
      scene.remove();
      addHands();
      lift.classList.remove("hidden");
      lift.classList.add("rise");
      await wait(1900);
      hands.forEach((h) => h.classList.add("leave"));
      await wait(900);
    } catch (e) { /* skipped */ }
    finish();
  }

  scene.querySelector(".play").addEventListener("click", play);
  scene.querySelector(".skip").addEventListener("click", () => { skipped = true; finish(); });
})();
