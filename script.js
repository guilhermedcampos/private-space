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

// Each chat's preview in the inbox shows its latest message, the same way for every contact.
const CHAT_PREVIEWS = [
  { href: "chats/sam.html", name: "Sam", key: "private-space-sam-conversation",
    messages: (s) => [...(s.messages || []), ...(s.postMessages || []), ...(s.afterGameMessages || [])] },
  { href: "chats/mum.html", name: "Mum", key: "private-space-mum-conversation-v1", messages: (s) => s.messages || [] },
  { href: "chats/alex.html", name: "Alex", key: "private-space-alex-conversation", messages: (s) => s.messages || [] },
];

function previewText(text) {
  if (text === "[[summary]]" || text.includes("data-open-summary")) return "Summary";
  if (text.startsWith("[[done:")) return `${text.slice(7, -2)} done`;
  return text.replace(/<[^>]*>/g, "").replace(/\*\*/g, "");
}

function updatePreviews() {
  CHAT_PREVIEWS.forEach(({ href, name, key, messages }) => {
    const preview = document.querySelector(`.conversation[href="${href}"] .preview`);
    if (!preview) return;
    try {
      const state = JSON.parse(sessionStorage.getItem(key) || "null");
      const list = state ? messages(state) : [];
      const latest = list[list.length - 1];
      if (latest) preview.textContent = `${latest.sender === "sent" ? "You" : name}: ${previewText(latest.text)}`;
    } catch {
      // Keep the default preview if browser storage is unavailable or malformed.
    }
  });
}

updatePreviews();
// Browsers may restore the inbox from its back/forward cache without rerunning scripts.
window.addEventListener("pageshow", updatePreviews);
