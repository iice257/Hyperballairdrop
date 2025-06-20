const SHEETDB_URL = "https://sheetdb.io/api/v1/zponyo90pqa3p";

// --- CONFIG ---
const PASSWORDS = {
  "hball": null,         // Unlimited
  "pavillon": 10,
  "ordi": 30,
  "africandao": 40
};

let totalSubmissions = 0;

// --- UTILS ---
const now = () => new Date().toISOString();
const ua = navigator.userAgent;

async function fetchSubmissionCount() {
  try {
    const res = await fetch(SHEETDB_URL);
    const data = await res.json();
    totalSubmissions = data.length;

    const countDisplay = document.getElementById("submission-count");
    if (countDisplay) {
      countDisplay.textContent = `🔥 ${totalSubmissions} of 200 HYPEMEN already submitted`;
    }
  } catch (err) {
    console.error("Error fetching submission count:", err);
  }
}

function logToSheet(data) {
  fetch(SHEETDB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [data] })
  }).catch(err => console.error("SheetDB POST error:", err));
}

// --- PASSWORD LOGIC ---
function checkPassword(e) {
  e.preventDefault();

  const input = document.getElementById('access-password').value.trim().toLowerCase();
  const error = document.getElementById('password-error');
  const usageMap = JSON.parse(localStorage.getItem('password_usage')) || {};
  const limit = PASSWORDS[input];

  if (!(input in PASSWORDS)) {
    error.innerHTML = '<i class="fas fa-exclamation-circle"></i> Incorrect password.';
    error.classList.remove("hidden");
    return;
  }

  if (limit !== null) {
    const used = usageMap[input] || 0;
    if (used >= limit) {
      error.innerHTML = '<i class="fas fa-lock"></i> Access closed: this code has reached its usage limit.';
      error.classList.remove("hidden");
      return;
    }
    usageMap[input] = used + 1;
    localStorage.setItem('password_usage', JSON.stringify(usageMap));
  }

  localStorage.setItem("access_granted", "true");
  localStorage.setItem("access_password", input);

  document.getElementById("password-gate").style.display = "none";
  document.getElementById("protected-content").style.display = "block";
}

// --- WALLET FORM LOGIC ---
function initWalletForm() {
  const form = document.getElementById("airdrop-form");
  const feedback = document.getElementById("feedback");
  const message = feedback.querySelector(".message");
  const tweetBtn = document.getElementById("tweet-btn");
  const walletInput = document.getElementById("wallet");

  const submitted = localStorage.getItem("wallet_submitted");
  const userNumber = localStorage.getItem("wallet_number");

  if (submitted === "true" && userNumber) {
    form.style.display = "none";
    feedback.classList.remove("hidden");
    message.innerHTML = `<i class="fas fa-circle-check"></i> Welcome back, Hypeman #${userNumber}. Your wallet was already submitted.`;
    tweetBtn.classList.remove("hidden");
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const wallet = walletInput.value.trim();
    const isValid = wallet.length >= 12 && wallet.startsWith("0x");

    feedback.classList.remove("hidden");
    message.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying wallet...`;

    setTimeout(() => {
      if (isValid) {
        const assignedNumber = totalSubmissions + 1;
        const password = localStorage.getItem("access_password") || "unknown";

        message.innerHTML = `<i class="fas fa-check-circle"></i> Wallet submitted! You’re Hypeman #${assignedNumber}. Check back soon to claim your <strong>HYPEMAN NFT</strong>.`;
        tweetBtn.classList.remove("hidden");

        localStorage.setItem("wallet_submitted", "true");
        localStorage.setItem("wallet_value", wallet);
        localStorage.setItem("wallet_number", assignedNumber);

        form.style.display = "none";

        logToSheet({
          wallet,
          timestamp: now(),
          userAgent: ua,
          status: "success",
          password
        });
      } else {
        message.innerHTML = `<i class="fas fa-times-circle"></i> Invalid wallet. Please input a valid wallet address.`;
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
    window.open(url, "_blank");
  });
}

// --- INIT ---
window.addEventListener("DOMContentLoaded", async () => {
  await fetchSubmissionCount();

  if (localStorage.getItem("access_granted") === "true") {
    document.getElementById("password-gate").style.display = "none";
    document.getElementById("protected-content").style.display = "block";
  }

  document.getElementById("password-form").addEventListener("submit", checkPassword);
  initWalletForm();
});
