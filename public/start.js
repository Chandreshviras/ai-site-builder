let JOB_ID = null;
let PREVIEW_URL = null;

const emailEl = document.getElementById("email");
const promptEl = document.getElementById("prompt");
const msgEl = document.getElementById("msg");
const optionsEl = document.getElementById("options");

const nextPanel = document.getElementById("nextPanel");
const previewLink = document.getElementById("previewLink");
const payBtn = document.getElementById("payBtn");
const payMsg = document.getElementById("payMsg");

document.getElementById("gen").addEventListener("click", async () => {
  msgEl.textContent = "Generating mockups...";
  optionsEl.innerHTML = "";
  nextPanel.style.display = "none";
  payMsg.textContent = "";

  const email = emailEl.value.trim();
  const prompt = promptEl.value.trim();

  if (!email || !prompt) {
    msgEl.textContent = "Please enter email and prompt.";
    return;
  }

  const r = await fetch("/api/mockups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, prompt })
  });

  const data = await r.json();
  if (!r.ok) {
    msgEl.textContent = data.error || "Failed";
    return;
  }

  JOB_ID = data.jobId;
  msgEl.textContent = "Choose one mockup option:";
  renderOptions(data.options);
});

function renderOptions(options) {
  optionsEl.innerHTML = options
    .map(
      (o) => `
    <div class="opt">
      <h3>${o.name}</h3>
      <div class="tag">${o.tagline}</div>
      <div class="tag" style="margin-top:6px;">${o.vibe}</div>

      <div class="palette">
        <div class="dot" style="background:${o.palette.primary}"></div>
        <div class="dot" style="background:${o.palette.accent}"></div>
        <div class="dot" style="background:${o.palette.bgDark}"></div>
      </div>

      <button class="choose" data-id="${o.id}">Choose Option ${o.id}</button>
    </div>
  `
    )
    .join("");

  document.querySelectorAll(".choose").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const optionId = btn.getAttribute("data-id");
      msgEl.textContent = `Generating full website for Option ${optionId}...`;

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: JOB_ID, optionId })
      });

      const data = await r.json();
      if (!r.ok) {
        msgEl.textContent = data.error || "Failed generating site";
        return;
      }

      PREVIEW_URL = data.preview;
      msgEl.textContent = "Website generated! Preview it and proceed to payment.";
      previewLink.href = PREVIEW_URL;
      nextPanel.style.display = "block";
    });
  });
}

// Payment
payBtn.addEventListener("click", async () => {
  payMsg.textContent = "Creating payment order...";

  const r = await fetch("/api/create-payment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId: JOB_ID })
  });

  const data = await r.json();
  if (!r.ok) {
    payMsg.textContent = data.error || "Payment init failed";
    return;
  }

  // Load Razorpay checkout script dynamically
  await loadScript("https://checkout.razorpay.com/v1/checkout.js");

  const options = {
    key: data.keyId,
    amount: data.amount,
    currency: data.currency,
    name: "Eminent AI",
    description: "AI Website Generation",
    order_id: data.orderId,
    handler: function () {
      payMsg.textContent =
        "Payment completed ✅. Website ZIP will be emailed to admin after webhook capture.";
    }
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

