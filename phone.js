// Shows every page inside a phone frame (phone.html) on wide screens.
// Inside the frame, it tells the shell which page is open and relays the
// optional side panel (e.g. crossword clues) that lives outside the phone.
(function () {
  const root = new URL(".", document.currentScript.src).href;
  const rel = location.href.startsWith(root) ? location.href.slice(root.length) || "index.html" : "";
  const inFrame = window.self !== window.top;

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

  post({ type: "phone:page", path: rel, title: document.title });
})();
