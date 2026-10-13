function start() {
  window.location.href = "messages.html";
}

const searchInput = document.getElementById("search");

if (searchInput) {
  const conversations = document.querySelectorAll(".conversation");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();

    conversations.forEach((conversation) => {
      const matches = conversation.textContent
        .toLowerCase()
        .includes(query);

      conversation.hidden = !matches;
    });
  });
}

// Reflect Sam's saved conversation in the inbox preview when it exists.
function updateSamPreview() {
  const samConversation = document.querySelector('.conversation[href="chats/sam.html"]');
  const preview = samConversation?.querySelector(".preview");
  if (!preview) return;

  try {
    const state = JSON.parse(sessionStorage.getItem("private-space-sam-conversation") || "null");
    if (!state?.started) return;

    const messages = state.messages || [];
    const latest = messages[messages.length - 1];

    if (state.phase === "quiz") {
      preview.textContent = state.quizAnswer
        ? "Quiz · Answer submitted"
        : "Challenge · What could an app predict from this activity?";
    } else if (state.phase === "challenge-options" || state.phase === "example-options") {
      preview.textContent = latest
        ? `Challenge · ${latest.sender === "sent" ? "You: " : "Sam: "}${latest.text}`
        : "Challenge · Sam has a question for you";
    } else if (latest) {
      preview.textContent = `${latest.sender === "sent" ? "You: " : "Sam: "}${latest.text}`;
    }
  } catch {
    // Keep the default preview if browser storage is unavailable or malformed.
  }
}

updateSamPreview();
// Browsers may restore the inbox from its back/forward cache without rerunning scripts.
window.addEventListener("pageshow", updateSamPreview);

// Notes: optional, private notes the learner can write and search later.
const notesSheet = document.getElementById("notesSheet");

if (notesSheet) {
  const NOTES_KEY = "private-space-notes";
  const openBtn = document.getElementById("notesOpen");
  const form = document.getElementById("notesForm");
  const text = document.getElementById("noteText");
  const chat = document.getElementById("noteChat");
  const search = document.getElementById("notesSearch");
  const list = document.getElementById("notesList");
  const empty = document.getElementById("notesEmpty");

  const load = () => {
    try { return JSON.parse(localStorage.getItem(NOTES_KEY) || "[]"); } catch { return []; }
  };
  const save = (notes) => {
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); } catch { /* storage unavailable */ }
  };
  let notes = load();

  function render() {
    const query = search.value.toLowerCase().trim();
    const shown = notes.filter((n) => `${n.text} ${n.chat}`.toLowerCase().includes(query));
    list.replaceChildren(...shown.map((note) => {
      const li = document.createElement("li");
      li.className = "note";
      const p = document.createElement("p");
      p.className = "note-text";
      p.textContent = note.text;
      const meta = document.createElement("div");
      meta.className = "note-meta";
      const tag = document.createElement("span");
      tag.className = "note-tag";
      tag.textContent = note.chat;
      const date = document.createElement("span");
      date.textContent = new Date(note.time).toLocaleDateString(undefined, { day: "numeric", month: "short" });
      const del = document.createElement("button");
      del.type = "button";
      del.className = "note-delete";
      del.textContent = "Delete";
      del.addEventListener("click", () => {
        if (del.dataset.confirm) {
          notes = notes.filter((n) => n !== note);
          save(notes);
          render();
        } else {
          del.dataset.confirm = "1";
          del.textContent = "Tap again to delete";
        }
      });
      meta.append(tag, date, del);
      li.append(p, meta);
      return li;
    }));
    empty.hidden = shown.length > 0;
    empty.textContent = notes.length ? "No notes match your search." : "No notes yet.";
  }

  function open() { notesSheet.hidden = false; render(); text.focus(); }
  function close() { notesSheet.hidden = true; openBtn.focus(); }

  openBtn.addEventListener("click", open);
  document.getElementById("notesClose").addEventListener("click", close);
  notesSheet.addEventListener("click", (e) => { if (e.target === notesSheet) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !notesSheet.hidden) close(); });
  search.addEventListener("input", render);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = text.value.trim();
    if (!value) return;
    notes.unshift({ text: value, chat: chat.value, time: Date.now() });
    save(notes);
    text.value = "";
    search.value = "";
    render();
  });
}
