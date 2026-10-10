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