// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyAJBy7jZyd3T_wBKQDFCdFbEpv1BCsa6_Q",
  authDomain: "hyperballairdrop.firebaseapp.com",
  projectId: "hyperballairdrop",
  storageBucket: "hyperballairdrop.firebasestorage.app",
  messagingSenderId: "440984186405",
  appId: "1:440984186405:web:3e20edb3bf3afa9617d9cc",
  measurementId: "G-HEJDWTW364"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === Passwords + Limits ===
const PASSWORDS = {
  "HBALL": null,        // unlimited
  "ORDI": 30,
  "PAVILION": 10,
  "AFRICANDAO": 40
};

let totalSubmissions = 0;
let currentPassword = "";

// === Fetch Submission Count from Firestore ===
async function fetchSubmissionCount() {
  const metaDoc = await db.collection("meta").doc("stats").get();
  totalSubmissions = metaDoc.exists ? metaDoc.data().totalSubmissions || 0 : 0;

  const countDisplay = document.getElementById("submission-count");
  if (countDisplay) {
    countDisplay.textContent = `🔥 ${totalSubmissions} of 200 HYPEMEN already submitted`;
  }
}

// === Password Gate ===
async function checkPassword() {
  const input = document.getElementById('access-password').value.toUpperCase();
  const error = document.getElementById('password-error');

  if (totalSubmissions >= 200) {
    error.innerHTML = '<i class="fas fa-lock"></i> Access closed: all slots filled.';
    error.classList.remove("hidden");
    return;
  }

  if (!Object.keys(PASSWORDS).includes(input)) {
    error.innerHTML = '<i class="fas fa-exclamation-circle"></i> Invalid password.';
    error.classList.remove("hidden");
    return;
  }

  // Check usage limit (if any)
  const doc = await db.collection("passwords").doc(input).get();
  const used = doc.exists ? doc.data().used || 0 : 0;
  const limit = PASSWORDS[input];

  if (limit !== null && used >= limit) {
    error.innerHTML = '<i class="fas fa-ban"></i> Password expired: usage limit reached.';
    error.classList.remove("hidden");
    return;
  }

  currentPassword = input;
  localStorage.setItem("access_granted", "true");
  localStorage.setItem("used_password", currentPassword);
  document.getElementById("password-gate").style.display = "none";
  document.getElementById("protected-content").style.display = "block";
}

// === Submit Wallet to Firestore ===
async function submitWallet(wallet, userAgent) {
  const userNumber = totalSubmissions + 1;
  const timestamp = new Date().toISOString();

  // Save to Firestore
  await db.collection("wallets").add({
    wallet,
    timestamp,
    userAgent,
    password: currentPassword,
    position: userNumber
  });

  // Update total count
  await db.collection("meta").doc("stats").set({ totalSubmissions: userNumber });

  // Increment password usage
  if (currentPassword !== "HBALL") {
    const pwRef = db.collection("passwords").doc(currentPassword);
    await pwRef.set({ used: firebase.firestore.FieldValue.increment(1) }, { merge: true });
  }

  return userNumber;
}

// === DOMContentLoaded Logic ===
window.addEventListener("DOMContentLoaded", async () => {
  await fetchSubmissionCount();

  const form = document.getElementById("airdrop-form");
  const feedback = document.getElementById("feedback");
  const message = feedback.querySelector(".message");
  const spinner = feedback.querySelector(".spinner");
  const tweetBtn = document.getElementById("tweet-btn");
  const walletInput = document.getElementById("wallet");
  const ua = navigator.userAgent;

  currentPassword = localStorage.getItem("used_password") || "";
  if (localStorage.getItem("access_granted") === "true") {
    document.getElementById("password-gate").style.display = "none";
    document.getElementById("protected-content").style.display = "block";
  }

  if (localStorage.getItem("wallet_submitted") === "true") {
    const userNumber = localStorage.getItem("wallet_number");
    form.style.display = "none";
    feedback.classList.remove("hidden");
    message.innerHTML = `<i class="fas fa-circle-check"></i> Welcome back, Hypeman #${userNumber}. Your wallet was already submitted.`;
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const wallet = walletInput.value.trim();
    const isValid = wallet.length >= 12 && wallet.startsWith("0x");

    feedback.classList.remove("hidden");
    message.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying wallet...`;
    spinner.classList.remove("hidden");
    tweetBtn.classList.add("hidden");

    setTimeout(async () => {
      spinner.classList.add("hidden");

      if (isValid) {
        const userNumber = await submitWallet(wallet, ua);
        totalSubmissions++;

        message.innerHTML = `<i class="fas fa-check-circle"></i> Wallet submitted! You’re Hypeman #${userNumber}. Check back soon to claim your <strong>HYPEMAN NFT</strong>.`;
        tweetBtn.classList.remove("hidden");

        localStorage.setItem("wallet_submitted", "true");
        localStorage.setItem("wallet_value", wallet);
        localStorage.setItem("wallet_number", userNumber);
        form.style.display = "none";
      } else {
        message.innerHTML = `<i class="fas fa-times-circle"></i> Invalid wallet. Please input valid wallet address.`;
        tweetBtn.classList.add("hidden");
        setTimeout(() => feedback.classList.add("hidden"), 6000);
      }
    }, 1500);
  });

  tweetBtn.addEventListener("click", () => {
    const tweet = "Just applied for the @hyperball_hl NFT and token airdrop program.";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    window.open(url, "_blank");
  });

  // Press Enter to unlock
  const passwordInput = document.getElementById("access-password");
  if (passwordInput) {
    passwordInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") checkPassword();
    });
  }
});

async function addPassword() {
  const id = document.getElementById("new-pass").value.trim().toUpperCase();
  const max = parseInt(document.getElementById("new-limit").value);

  if (!id || isNaN(max)) {
    alert("Enter a valid password and numeric limit.");
    return;
  }

  try {
    await updateDoc(doc(db, "passwords", id), { max: max, used: 0 });
    alert(`Password ${id} added or updated.`);
  } catch (err) {
    console.error("Failed to add/update password", err);
  }
}

async function revokePassword() {
  const id = document.getElementById("revoke-pass").value.trim().toUpperCase();
  if (!id) return alert("Enter a valid password to revoke");

  try {
    await updateDoc(doc(db, "passwords", id), { max: 0 });
    alert(`Password ${id} revoked (set to 0).`);
  } catch (err) {
    console.error("Failed to revoke password", err);
  }
}
