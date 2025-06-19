const SHEETDB_URL = "https://sheetdb.io/api/v1/sc2q0pto25o9m";

// Passwords + Limits
const PASSWORDS = {
  "HBALL": null, // unlimited
  "PAVILION": 10,
  "ORDI": 30,
  "AFRICANDAO": 40
};

let totalSubmissions = 0;
let passwordUsed = null;

// Fetch submission count
async function fetchSubmissionCount() {
  try {
    const res = await fetch(SHEETDB_URL);
    const data = await res.json();
    totalSubmissions = data.length;

    const countDisplay = document.getElementById("submission-count");
    if (countDisplay)
      countDisplay.textContent = `🔥 ${totalSubmissions} of 200 HYPEMEN already submitted`;
  } catch (err) {
    console.error("Error fetching submission count:", err);
  }
}

// Password access
function checkPassword() {
  const input = document.getElementById('access-password').value.trim().toUpperCase();
  const error = document.getElementById('password-error');

  if (totalSubmissions >= 200) {
    error.innerHTML = '<i class="fas fa-lock"></i> Access closed: all slots filled.';
    error.classList.remove("hidden");
    return;
  }

  if (PASSWORDS.hasOwnProperty(input)) {
    const maxUsage = PASSWORDS[input];
    passwordUsed = input;

    if (maxUsage !== null && totalSubmissions >= maxUsage) {
      error.innerHTML = '<i class="fas fa-lock"></i> This password has expired.';
      error.classList.remove("hidden");
      return;
    }

    localStorage.setItem("access_granted", "true");
    localStorage.setItem("access_password", input);
    document.getElementById("password-gate").style.display = "none";
    document.getElementById("protected-content").style.display = "block";
  } else {
    error.innerHTML = '<i class="fas fa-exclamation-circle"></i> Incorrect password.';
    error.classList.remove("hidden");
  }
}

// Form logic
function initWalletForm() {
  const form = document.getElementById("airdrop-form");
  const feedback = document.getElementById("feedback");
  const message = feedback.querySelector(".message");
  const spinner = feedback.querySelector(".spinner");
  const tweetBtn = document.getElementById("tweet-btn");
  const walletInput = document.getElementById("wallet");

  const ua = navigator.userAgent;
  const now = () => new Date().toISOString();

  if (localStorage.getItem("wallet_submitted") === "true") {
    const userNumber = localStorage.getItem("wallet_number");
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
    spinner.classList.remove("hidden");
    tweetBtn.classList.add("hidden");
    message.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying wallet...`;

    setTimeout(() => {
      spinner.classList.add("hidden");

      if (isValid) {
        const userNumber = totalSubmissions + 1;
        message.innerHTML = `<i class="fas fa-check-circle"></i> Wallet submitted! You’re Hypeman #${userNumber}.<br><strong>Check back soon to claim your HYPEMAN NFT.</strong>`;
        tweetBtn.classList.remove("hidden");

        localStorage.setItem("wallet_submitted", "true");
        localStorage.setItem("wallet_value", wallet);
        localStorage.setItem("wallet_number", userNumber);
        form.style.display = "none";

        logToSheet({ wallet, timestamp: now(), userAgent: ua, status: "success", passwordUsed });
      } else {
        message.innerHTML = `<i class="fas fa-times-circle"></i> Invalid wallet. Please input valid wallet address.`;
        logToSheet({ wallet, timestamp: now(), userAgent: ua, status: "fail", passwordUsed });
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

// Submit to SheetDB
function logToSheet(data) {
  fetch(SHEETDB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [data] })
  }).catch(err => console.error("SheetDB error:", err));
}

// On Page Load
window.addEventListener("DOMContentLoaded", async () => {
  await fetchSubmissionCount();

  const passwordGate = document.getElementById("password-gate");
  const protectedContent = document.getElementById("protected-content");

  // Show the correct section based on localStorage
  if (localStorage.getItem("access_granted") === "true") {
    passwordGate.style.display = "none";
    protectedContent.style.display = "block";
  } else {
    passwordGate.style.display = "block";
    protectedContent.style.display = "none";
  }

  // Allow pressing Enter to submit password
  const passwordInput = document.getElementById("access-password");
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      checkPassword();
    }
  });

  initWalletForm();
});
