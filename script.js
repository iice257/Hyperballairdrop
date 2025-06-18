window.addEventListener('DOMContentLoaded', () => {
  const allowedPassword = "HYPIO";
  const entered = localStorage.getItem('access_granted');

  if (entered !== 'true') {
    const pass = prompt("Enter password to access:");
    if (pass !== allowedPassword) {
      alert("Incorrect password. Reload to try again.");
      document.body.innerHTML = ""; 
      return;
    }
    localStorage.setItem('access_granted', 'true');
  }
});
const SHEETDB_URL = "https://sheetdb.io/api/v1/sc2q0pto25o9m";

function logToSheet(data) {
  fetch(SHEETDB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [data] })
  })
  .catch(err => console.error("SheetDB error:", err));
}

window.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("airdrop-form");
  const feedback = document.getElementById("feedback");
  const message = feedback.querySelector(".message");
  const spinner = feedback.querySelector(".spinner");
  const tweetBtn = document.getElementById("tweet-btn");
  const walletInput = document.getElementById("wallet");

  const ua = navigator.userAgent;
  const now = () => new Date().toISOString();

  if (localStorage.getItem("wallet_submitted") === "true") {
    form.style.display = "none";
    feedback.classList.remove("hidden");
    message.textContent = "✅ You’ve already submitted your wallet. Thank you!";
    
    logToSheet({
      wallet: localStorage.getItem("wallet_value"),
      timestamp: now(),
      userAgent: ua,
      status: "revisit-success"
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const wallet = walletInput.value.trim();
    const isValid = wallet.length >= 12 && wallet.startsWith("0x");

    feedback.classList.remove("hidden");
    message.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying wallet...`;
    spinner.classList.remove("hidden");
    tweetBtn.classList.add("hidden");

    setTimeout(() => {
      spinner.classList.add("hidden");

      if (isValid) {
        message.innerHTML = `<i class="fas fa-check-circle"></i> Wallet submitted! Check back to claim your <strong>HYPEMAN NFT</strong>.`;
        tweetBtn.classList.remove("hidden");

        localStorage.setItem("wallet_submitted", "true");
        localStorage.setItem("wallet_value", wallet);
        form.style.display = "none";

        logToSheet({
          wallet,
          timestamp: now(),
          userAgent: ua,
          status: "success"
        });

      } else {
        message.innerHTML = `<i class="fas fa-times-circle"></i> Invalid wallet. Please input valid wallet address.`;
        tweetBtn.classList.add("hidden");

        logToSheet({
          wallet,
          timestamp: now(),
          userAgent: ua,
          status: "fail"
        });

        setTimeout(() => feedback.classList.add("hidden"), 6000);
      }
    }, 1500);
  });

  tweetBtn.addEventListener("click", () => {
    const tweet = "Just applied for the @hyperball_hl NFT and token airdrop program.";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    
    logToSheet({
      wallet: localStorage.getItem("wallet_value") || "",
      timestamp: now(),
      userAgent: ua,
      status: "tweet-click"
    });

    window.open(url, "_blank");
  });
});
