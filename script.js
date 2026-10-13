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
      const text = latest.text.includes("data-open-summary") ? "Summary" : latest.text.replace(/<[^>]*>/g, "");
      preview.textContent = `${latest.sender === "sent" ? "You: " : "Sam: "}${text}`;
    }
  } catch {
    // Keep the default preview if browser storage is unavailable or malformed.
  }
}

updateSamPreview();
// Browsers may restore the inbox from its back/forward cache without rerunning scripts.
window.addEventListener("pageshow", updateSamPreview);

