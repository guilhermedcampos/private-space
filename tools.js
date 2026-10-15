// Shared learner tools, used the same way in every screen:
// - My notes: optional notes the learner writes or saves from a summary.
// - Summary: the main points of a chat, each one can be saved to notes.
// - Settings: Calm mode (applied on every page by phone.js).
(function () {
  const NOTES_KEY = "private-space-notes";
  const CALM_KEY = "private-space-calm";

  const SUMMARIES = {
    sam: {
      contact: "Sam",
      title: "Apps can guess things about you",
      points: [
        "Apps can guess your interests from what you do online, like what you watch, search for, or like.",
        "These guesses are predictions, not facts. A wrong guess doesn't define you.",
        "Check: an app's privacy or history settings show what it saved about you.",
        "Pause or clear: you can pause your watch history or clear your searches.",
        "Incognito stops your device saving your history. It doesn't make you invisible.",
      ],
    },
    alex: {
      contact: "Alex",
      title: "[Placeholder]",
      points: ["[Placeholder]", "[Placeholder]", "[Placeholder]"],
    },
    mum: {
      contact: "Mum",
      title: "Cookies and consent",
      points: [
        "Cookies are small pieces of data that websites save in your browser.",
        "Some cookies are useful. They remember your cart, your language, and that you're logged in.",
        "Tracking cookies can follow what you browse on different websites to show you ads.",
        "You can choose: accept all, reject optional cookies, or customise.",
        "Rejecting optional cookies usually doesn't stop the website from working.",
        "You can delete cookies in your browser settings. This may log you out of websites.",
      ],
    },
  };

  function read(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // One bottom sheet at a time, with the same header, Close button and Esc behaviour.
  let closeCurrent = null;
  function openSheet(title, build) {
    if (closeCurrent) closeCurrent(false);
    const opener = document.activeElement;
    const overlay = el("div", "sheet");
    const panel = el("div", "sheet-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    const header = el("header", "sheet-top");
    const heading = el("h2", "", title);
    heading.id = "sheet-title";
    panel.setAttribute("aria-labelledby", heading.id);
    const closeBtn = el("button", "sheet-close", "Close");
    closeBtn.type = "button";
    header.append(heading, closeBtn);
    panel.append(header);
    overlay.append(panel);

    function close(restoreFocus = true) {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
      closeCurrent = null;
      if (restoreFocus && opener && opener.focus) opener.focus({ preventScroll: true });
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    closeBtn.addEventListener("click", () => close());
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);

    build(panel, close);
    document.body.append(overlay);
    closeCurrent = close;
    (panel.querySelector("[data-autofocus]") || closeBtn).focus({ preventScroll: true });
  }

  // ---- Notes ----
  const loadNotes = () => read(NOTES_KEY, []);
  const saveNotes = (notes) => write(NOTES_KEY, notes);

  function openNotes() {
    openSheet("My notes", (panel) => {
      panel.append(el("p", "sheet-intro", "Write down anything you found useful. This is optional. Your notes stay only on this device."));

      const form = el("form", "notes-form");
      const label = el("label", "notes-label", "New note");
      label.htmlFor = "noteText";
      const text = el("textarea");
      text.id = "noteText";
      text.rows = 3;
      text.placeholder = "For example: Incognito doesn't make me invisible.";
      text.dataset.autofocus = "";
      const row = el("div", "notes-form-row");
      const fromLabel = el("label", "notes-label", "From");
      fromLabel.htmlFor = "noteChat";
      const chat = el("select");
      chat.id = "noteChat";
      ["General", "Sam", "Mum", "Alex"].forEach((name) => chat.append(new Option(name)));
      const here = document.body.dataset.contact;
      if (here) chat.value = here;
      const submit = el("button", "sheet-action", "Save note");
      submit.type = "submit";
      row.append(fromLabel, chat, submit);
      form.append(label, text, row);

      const search = el("label", "notes-search");
      search.innerHTML = '<span aria-hidden="true">⌕</span>';
      const searchInput = el("input");
      searchInput.type = "search";
      searchInput.placeholder = "Search my notes";
      searchInput.setAttribute("aria-label", "Search my notes");
      search.append(searchInput);

      const list = el("ul", "notes-list");
      const empty = el("p", "notes-empty");
      panel.append(form, search, list, empty);

      let notes = loadNotes();
      function render() {
        const query = searchInput.value.toLowerCase().trim();
        const shown = notes.filter((n) => `${n.text} ${n.chat}`.toLowerCase().includes(query));
        list.replaceChildren(...shown.map((note) => {
          const li = el("li", "note");
          const meta = el("div", "note-meta");
          const date = new Date(note.time).toLocaleDateString(undefined, { day: "numeric", month: "short" });
          const del = el("button", "note-delete", "Delete");
          del.type = "button";
          del.addEventListener("click", () => {
            if (del.dataset.confirm) {
              notes = notes.filter((n) => n !== note);
              saveNotes(notes);
              render();
            } else {
              del.dataset.confirm = "1";
              del.textContent = "Tap again to delete";
            }
          });
          meta.append(el("span", "note-tag", note.chat), el("span", "", note.source ? `From summary · ${date}` : date), del);
          li.append(el("p", "note-text", note.text), meta);
          return li;
        }));
        empty.hidden = shown.length > 0;
        empty.textContent = notes.length ? "No notes match your search." : "No notes yet.";
      }

      searchInput.addEventListener("input", render);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const value = text.value.trim();
        if (!value) return;
        notes.unshift({ text: value, chat: chat.value, time: Date.now() });
        saveNotes(notes);
        text.value = "";
        searchInput.value = "";
        render();
      });
      render();
    });
  }

  // ---- Summary ----
  function openSummary(id) {
    const summary = SUMMARIES[id];
    if (!summary) return;
    openSheet("Summary", (panel, close) => {
      panel.append(el("h3", "summary-title", summary.title));
      panel.append(el("p", "sheet-intro", `The main points from your chat with ${summary.contact}. Tap Save on any point you want to keep in your notes.`));

      const list = el("ol", "summary-points");
      summary.points.forEach((point, index) => {
        const source = `${id}-${index}`;
        const li = el("li", "summary-point");
        const button = el("button", "save-toggle");
        button.type = "button";
        const sync = () => {
          const saved = loadNotes().some((n) => n.source === source);
          button.setAttribute("aria-pressed", String(saved));
          button.textContent = saved ? "✓ Saved" : "+ Save";
          button.setAttribute("aria-label", saved ? `Remove point ${index + 1} from notes` : `Save point ${index + 1} to notes`);
        };
        button.addEventListener("click", () => {
          const notes = loadNotes();
          const existing = notes.findIndex((n) => n.source === source);
          if (existing >= 0) notes.splice(existing, 1);
          else notes.unshift({ text: point, chat: summary.contact, time: Date.now(), source });
          saveNotes(notes);
          sync();
        });
        sync();
        li.append(el("p", "", point), button);
        list.append(li);
      });
      panel.append(list);

      const notesLink = el("button", "sheet-link", "Open my notes");
      notesLink.type = "button";
      notesLink.addEventListener("click", () => { close(false); openNotes(); });
      panel.append(notesLink);
    });
  }

  // ---- Settings ----
  const SOUND_KEY = "private-space-sound";
  function settingRow(panel, { name, help, get, set }) {
    const row = el("div", "setting-row");
    const textBox = el("div");
    textBox.append(el("p", "setting-name", name), el("p", "setting-help", help));
    const toggle = el("button", "switch");
    toggle.type = "button";
    toggle.setAttribute("role", "switch");
    toggle.setAttribute("aria-label", name);
    toggle.innerHTML = '<span class="switch-knob" aria-hidden="true"></span>';
    const sync = () => toggle.setAttribute("aria-checked", String(get()));
    toggle.addEventListener("click", () => { set(!get()); sync(); });
    sync();
    row.append(textBox, toggle);
    panel.append(row);
    return toggle;
  }

  const isCalm = () => read(CALM_KEY, false) === true;
  const isSoundOn = () => read(SOUND_KEY, true) !== false;
  function openSettings() {
    openSheet("Settings", (panel) => {
      settingRow(panel, {
        name: "Calm mode",
        help: "Turns off movement: typing dots, moving clouds and horses, and confetti. Everything else stays the same.",
        get: isCalm,
        set: (on) => { write(CALM_KEY, on); document.documentElement.classList.toggle("calm", on); }
      }).dataset.autofocus = "";
      settingRow(panel, {
        name: "Sound",
        help: "Plays short sounds in the games, like when you get an answer right, finish a word, or win a race.",
        get: isSoundOn,
        set: (on) => write(SOUND_KEY, on)
      });
    });
  }

  // A summary shared in a chat opens the same sheet, even after the chat is restored.
  document.addEventListener("click", (e) => {
    const card = e.target.closest("[data-open-summary]");
    if (card) openSummary(card.dataset.openSummary);
  });

  // The summary "attachment" a contact sends in the chat (looks like a shared document).
  function summaryCardHTML(id) {
    const summary = SUMMARIES[id];
    return `<button class="summary-attachment" type="button" data-open-summary="${id}">` +
      `<span class="summary-attachment-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 11h7M9 15h7M9 19h4"/></svg></span>` +
      `<span><strong>Summary</strong><br>${summary.title}</span></button>`;
  }

  // ---- Undo: each chat saves where it was just before every reply the learner taps ----
  const undoKey = (storageKey) => `${storageKey}-undo`;
  function readUndo(storageKey) {
    try { return JSON.parse(sessionStorage.getItem(undoKey(storageKey)) || "[]"); } catch { return []; }
  }
  // Call at the start of every reply/answer click, before the chat changes.
  function snapshot(storageKey) {
    try {
      const steps = readUndo(storageKey);
      steps.push(sessionStorage.getItem(storageKey));
      sessionStorage.setItem(undoKey(storageKey), JSON.stringify(steps.slice(-50)));
    } catch { /* storage unavailable */ }
  }
  function undoLastReply(storageKey) {
    const steps = readUndo(storageKey);
    if (!steps.length) return;
    const before = steps.pop();
    try {
      if (before === null) sessionStorage.removeItem(storageKey);
      else sessionStorage.setItem(storageKey, before);
      sessionStorage.setItem(undoKey(storageKey), JSON.stringify(steps));
    } catch { /* storage unavailable */ }
    location.reload();
  }

  // Chat header: Summary, and ↺ to undo the last reply or start the chat again.
  function mountChatHeader({ summary, storageKey }) {
    document.getElementById("summaryButton").addEventListener("click", () => openSummary(summary));
    document.getElementById("rewindButton").addEventListener("click", () => {
      openSheet("Go back?", (panel, close) => {
        panel.append(el("p", "sheet-intro", "Undo your last reply to try a different one, or start this chat again from the first message. Your notes stay saved."));
        const actions = el("div", "confirm-actions");
        const undo = el("button", "reply-button primary", "Undo my last reply");
        const restart = el("button", "reply-button", "Start the chat again");
        const no = el("button", "reply-button", "No, keep my chat");
        undo.type = restart.type = no.type = "button";
        no.dataset.autofocus = "";
        if (!readUndo(storageKey).length) {
          undo.disabled = true;
          undo.textContent = "Undo my last reply (nothing to undo yet)";
        }
        undo.addEventListener("click", () => undoLastReply(storageKey));
        restart.addEventListener("click", () => {
          try {
            sessionStorage.removeItem(storageKey);
            sessionStorage.removeItem(undoKey(storageKey));
          } catch { /* storage unavailable */ }
          location.reload();
        });
        no.addEventListener("click", () => close());
        actions.append(undo, restart, no);
        panel.append(actions);
      });
    });
  }

  window.Tools = { openNotes, openSummary, openSettings, summaryCardHTML, mountChatHeader, snapshot, SUMMARIES };
})();
