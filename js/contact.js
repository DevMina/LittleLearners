// Contact address for the mailto-based form below.
const CONTACT_EMAIL = "mina.abdo2030@gmail.com";

document.getElementById("sendBtn").addEventListener("click", () => {
  const name = document.getElementById("nameInput").value.trim();
  const email = document.getElementById("emailInput").value.trim();
  const message = document.getElementById("messageInput").value.trim();
  const status = document.getElementById("contactStatus");

  if (!message) {
    status.textContent = "Please write a message first.";
    return;
  }

  const subject = "Little Learners feedback" + (name ? " from " + name : "");
  const bodyLines = [message, "", "—", name ? "From: " + name : "", email ? "Reply to: " + email : ""].filter(Boolean);
  const mailto =
    "mailto:" + CONTACT_EMAIL +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(bodyLines.join("\n"));

  window.location.href = mailto;
  status.textContent = "Opening your email app…";
});
