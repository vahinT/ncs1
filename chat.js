const token = "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";  // Don't expose in production!
const repoOwner = "VahinT-11x";
const repoName = "NIO_1SS";
const chatFile = "chaat__1.txt";
const typingFile = "typing_status.txt";

let lastSha = "";
let currentUser = "vahin";

document.getElementById("userSelect").addEventListener("change", (e) => {
  currentUser = e.target.value;
});

document.getElementById("sendBtn").addEventListener("click", sendMessage);
document.getElementById("messageInput").addEventListener("input", () => {
  updateTypingStatus(currentUser);
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => updateTypingStatus(""), 2000);
});

let typingTimeout = null;

async function githubGetContent(file) {
  const res = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${file}`, {
    headers: { Authorization: `token ${token}` }
  });
  const data = await res.json();
  const content = atob(data.content);
  return { content, sha: data.sha };
}

async function githubPutContent(file, content, sha, message) {
  const encoded = btoa(content);
  const body = {
    message,
    content: encoded,
    sha,
    branch: "main"
  };
  await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/contents/${file}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `token ${token}` },
    body: JSON.stringify(body)
  });
}

async function refreshChat() {
  try {
    const { content, sha } = await githubGetContent(chatFile);
    if (sha !== lastSha) {
      document.getElementById("chatLog").innerText = content;
      lastSha = sha;
    }

    const { content: typingUser } = await githubGetContent(typingFile);
    const display = typingUser.trim() && typingUser.trim() !== currentUser
      ? `${typingUser.trim()} is typing...` : "";
    document.getElementById("typingStatus").innerText = display;
  } catch (e) {
    console.error("Error refreshing chat:", e.message);
    document.getElementById("chatLog").innerText = "Failed to load chat messages.";
  }
}

async function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  const timestamp = new Date().toLocaleTimeString().slice(0, 5);
  const message = `${currentUser} [${timestamp}]: ${text}`;

  const { content, sha } = await githubGetContent(chatFile);
  const newContent = content + message + "\n";
  await githubPutContent(chatFile, newContent, sha, "New message");
}

async function updateTypingStatus(user) {
  const { sha } = await githubGetContent(typingFile);
  await githubPutContent(typingFile, user, sha, "Typing status update");
}
refreshChat();  // ← This ensures the chat loads immediately
setInterval(refreshChat, 1000);


