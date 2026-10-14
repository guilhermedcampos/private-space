// Shows every page inside a phone frame (phone.html) on wide screens.
// Inside the frame, it tells the shell which page is open and relays the
// optional side panel (e.g. crossword clues) that lives outside the phone.
(function () {
  const root = new URL(".", document.currentScript.src).href;
  const rel = location.href.startsWith(root) ? location.href.slice(root.length) || "home.html" : "";
  const inFrame = window.self !== window.top;

  // Calm mode (Settings): no movement and no celebration effects, on every page.
  const calmStyle = document.createElement("style");
  calmStyle.textContent =
    "html.calm *, html.calm *::before, html.calm *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }" +
    "html.calm .confetti-fall, html.calm .dust-puff, html.calm .celebration, html.calm .emoji-drop, html.calm .cloud-drift { display: none !important; }";
  document.head.appendChild(calmStyle);
  try {
    if (JSON.parse(localStorage.getItem("private-space-calm")) === true) document.documentElement.classList.add("calm");
  } catch (e) { /* storage unavailable */ }

  if (!inFrame) {
    // Real phones are already phone-sized; ?nophone opens a page on its own.
    const isPhone = window.matchMedia("(max-width: 500px) and (pointer: coarse)").matches;
    if (isPhone || /[?&]nophone\b/.test(location.search) || !rel) return;
    const toFrame = () => location.replace(root + "phone.html#" + rel);
    toFrame();
    // A page restored by the Back button skips scripts, so send it to the frame again.
    window.addEventListener("pageshow", (e) => { if (e.persisted) toFrame(); });
    return;
  }

  document.documentElement.classList.add("in-phone");

  function post(msg) {
    try { window.parent.postMessage(msg, "*"); } catch (e) { /* shell missing */ }
  }

  // Pages call PhoneShell.setSide(html) to show content next to the phone,
  // and PhoneShell.onSideClick(fn) to react to clicks on [data-side-action].
  let sideClick = null;
  window.PhoneShell = {
    embedded: true,
    setSide(html) { post({ type: "phone:side", html }); },
    onSideClick(fn) { sideClick = fn; },
  };

  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "phone:side-click" && sideClick) sideClick(e.data.action);
  });

  post({ type: "phone:page", path: rel });
  // The page's <title> comes after this script, so send it once the page has loaded.
  document.addEventListener("DOMContentLoaded", () => post({ type: "phone:title", title: document.title }));
})();
