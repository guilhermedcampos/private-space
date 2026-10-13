// "How to play" for every game: shown once per visit before playing,
// and any time from the "? How to play" button in the bottom-right corner.
// Usage: GameHelp.mount({ id, subtitle, rules: ["...", ...] }) — rules may contain <b>.
(function () {
  const css = `
    #game-help-btn{position:fixed;right:16px;bottom:16px;z-index:200;height:44px;padding:0 16px;border-radius:999px;border:3px solid #000;background:#fff;color:#111;font:900 15px Nunito,system-ui,sans-serif;box-shadow:0 4px 0 #000;cursor:pointer;width:auto;transform:none}
    #game-help-btn:active{transform:translateY(2px);box-shadow:0 2px 0 #000}
    #game-help{position:fixed;inset:0;z-index:300;background:rgba(17,17,17,.45);display:flex;align-items:center;justify-content:center;padding:20px}
    #game-help[hidden]{display:none}
    #game-help .box{width:100%;max-width:360px;max-height:100%;overflow-y:auto;background:#fff;border:4px solid #000;border-radius:22px;box-shadow:0 10px 0 #111;padding:22px;font-family:Nunito,system-ui,sans-serif;color:#222}
    #game-help h2{margin:0 0 4px;font-size:22px;font-weight:900}
    #game-help .sub{margin:0 0 14px;font-size:14px;font-weight:700;opacity:.65}
    #game-help ol{margin:0;padding-left:20px;font-size:15px;line-height:1.45;font-weight:600}
    #game-help li{margin-bottom:8px}
    #game-help b{font-weight:900}
    #game-help button.ok{margin-top:14px;width:100%;padding:12px;border:0;border-radius:999px;background:#111;color:#fff;font:900 16px Nunito,system-ui,sans-serif;cursor:pointer}`;

  function mount({ id, subtitle, rules }) {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);

    const btn = document.createElement("button");
    btn.id = "game-help-btn";
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("aria-controls", "game-help");
    btn.textContent = "? How to play";

    const dlg = document.createElement("div");
    dlg.id = "game-help";
    dlg.setAttribute("role", "dialog");
    dlg.setAttribute("aria-modal", "true");
    dlg.setAttribute("aria-labelledby", "game-help-title");
    dlg.hidden = true;
    dlg.innerHTML = `<div class="box"><h2 id="game-help-title">How to play</h2><p class="sub"></p><ol>${rules.map((r) => `<li>${r}</li>`).join("")}</ol><button class="ok" type="button">Got it</button></div>`;
    dlg.querySelector(".sub").textContent = subtitle;
    document.body.append(btn, dlg);

    const ok = dlg.querySelector(".ok");
    const open = () => { dlg.hidden = false; ok.focus(); };
    const close = () => { dlg.hidden = true; btn.focus(); };
    btn.addEventListener("click", open);
    ok.addEventListener("click", close);
    dlg.addEventListener("click", (e) => { if (e.target === dlg) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !dlg.hidden) close(); });

    // Show the rules automatically the first time the game is opened in this visit.
    let seen = false;
    try {
      seen = sessionStorage.getItem(`${id}-help-seen`) === "1";
      sessionStorage.setItem(`${id}-help-seen`, "1");
    } catch (e) { /* storage unavailable */ }
    if (!seen) open();
  }

  window.GameHelp = { mount };
})();
