form.addEventListener("submit", (e) => {
  e.preventDefault();

  const wallet = walletInput.value.trim();
  const isValid = wallet.length >= 12 && wallet.startsWith("0x");

  feedback.classList.remove("hidden");
  message.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verifying wallet...`;

  setTimeout(() => {
    const passwordToLog = currentPassword || localStorage.getItem("access_password") || "unknown";

    if (isValid) {
      const assignedNumber = totalSubmissions + 1;

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
        password: passwordToLog
      });

    } else {
      message.innerHTML = `<i class="fas fa-times-circle"></i> Invalid wallet. Please input a valid wallet address.`;
      tweetBtn.classList.add("hidden");

      logToSheet({
        wallet,
        timestamp: now(),
        userAgent: ua,
        status: "fail",
        password: passwordToLog
      });

      setTimeout(() => feedback.classList.add("hidden"), 6000);
    }
  }, 1500);
});
