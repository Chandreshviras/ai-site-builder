import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import archiver from "archiver";
import nodemailer from "nodemailer";
import Razorpay from "razorpay";

import { fileURLToPath } from "url";

const app = express();
app.use(cors());

// Razorpay webhook needs raw body — keep JSON for normal routes
app.use(express.json());

const PORT = process.env.PORT || 10000;

// ESM __dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// ENV (Required)
// --------------------
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// --------------------
// Utilities
// --------------------
function mustEnv(name, value) {
  if (!value) throw new Error(`Missing env: ${name}`);
}

function uid() {
  return crypto.randomBytes(10).toString("hex");
}

function safeText(s = "") {
  return String(s).replace(/[<>]/g, "");
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

// --------------------
// In-memory store for jobs (MVP)
// For production: store in Supabase DB
// --------------------
const JOBS = new Map();
/**
 * job = {
 *  id,
 *  prompt,
 *  customerEmail,
 *  optionA, optionB,
 *  chosenOption,
 *  siteDir,
 *  payment: { orderId, amount, currency }
 * }
 */

// --------------------
// Theme presets (Fast mockups)
// --------------------
function buildMockupsFromPrompt(prompt) {
  // "AI-like" quick classification (MVP) — upgrade to OpenAI later
  const p = prompt.toLowerCase();

  const isRestaurant = /restaurant|cafe|bakery|food|pizza|bar|kitchen/.test(p);
  const isAgency = /agency|marketing|seo|branding|web|design|studio/.test(p);
  const isDoctor = /clinic|doctor|hospital|dental|dentist|physio/.test(p);
  const isRealEstate = /real\s*estate|property|realtor|broker|home|villa/.test(p);

  // Two stylish presets
  const A = {
    id: "A",
    name: "Modern Glass",
    tagline: "Premium • Clean • Conversion-first",
    palette: { primary: "#fbbf24", accent: "#60a5fa", bgDark: "#0b1120" },
    heroStyle: "split",
    vibe:
      isRestaurant
        ? "Luxury dining vibe with mouth-watering hero + reservation CTA."
        : isDoctor
        ? "Trust-first clinic design with appointment CTAs."
        : isRealEstate
        ? "High-end property style with listing-ready sections."
        : isAgency
        ? "Agency/SaaS style with growth messaging."
        : "Modern business style with strong CTA."
  };

  const B = {
    id: "B",
    name: "Bold Gradient",
    tagline: "Trendy • Bright • Modern AI feel",
    palette: { primary: "#22c55e", accent: "#a78bfa", bgDark: "#050816" },
    heroStyle: "center",
    vibe:
      isRestaurant
        ? "Vibrant foodie vibe with menu highlights + order CTA."
        : isDoctor
        ? "Clean medical style with services grid + testimonials."
        : isRealEstate
        ? "Cinematic listings vibe + enquiry funnel."
        : isAgency
        ? "Bold agency vibe with animated sections."
        : "Fresh modern design with bold gradients."
  };

  return { A, B };
}

// --------------------
// Site generator (creates real files)
// --------------------
function generateSiteFiles({ jobId, prompt, chosen, customerEmail }) {
  const siteId = jobId;
  const siteDir = path.join(__dirname, "generated-sites", siteId);
  ensureDir(siteDir);

  // Basic business extraction (MVP)
  const businessName =
    prompt.split("\n")[0]?.slice(0, 60) || "Your Business";
  const description =
    "Modern, responsive website generated with Eminent AI — designed to convert visitors into customers.";

  const pageTitles = {
    home: "Home",
    services: "Services",
    about: "About",
    contact: "Contact"
  };

  const nav = Object.keys(pageTitles)
    .map(
      (k) =>
        `<a class="nav-link" href="./${k}.html">${pageTitles[k]}</a>`
    )
    .join("");

  // Shared CSS (theme driven)
  const css = buildThemeCSS(chosen);

  // Page templates
  const pages = ["home", "services", "about", "contact"];
  for (const page of pages) {
    const html = buildPageHTML({
      page,
      businessName,
      description,
      nav,
      chosen,
      prompt,
      customerEmail
    });
    fs.writeFileSync(path.join(siteDir, `${page}.html`), html, "utf8");
  }

  fs.writeFileSync(path.join(siteDir, `styles.css`), css, "utf8");

  return { siteDir, siteId };
}

function buildThemeCSS(chosen) {
  // Includes: modern layout + animations + dark/light variables
  // Uses chosen palette as brand accents
  const primary = chosen.palette.primary;
  const accent = chosen.palette.accent;

  return `
/* ========= Reset ========= */
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
img{max-width:100%;display:block}
a{text-decoration:none;color:inherit}
button{font-family:inherit}

/* ========= Theme variables ========= */
:root{
  --primary:${primary};
  --accent:${accent};
  --radius:18px;
  --shadow:0 30px 80px rgba(0,0,0,0.35);
}

body[data-theme="dark"]{
  --bg:#0b1120;
  --card:rgba(255,255,255,0.06);
  --text:#f8fafc;
  --muted:#cbd5e1;
  --sub:#94a3b8;
  --border:rgba(255,255,255,0.12);
}

body[data-theme="light"]{
  --bg:#f8fafc;
  --card:#ffffff;
  --text:#0f172a;
  --muted:#1f2937;
  --sub:#475569;
  --border:#e2e8f0;
}

body{
  background:var(--bg);
  color:var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  line-height:1.6;
  transition:background .25s ease,color .25s ease;
}

/* ========= Layout ========= */
.container{width:min(1180px,92%);margin:0 auto}
.section{padding:80px 0}
.section-head{text-align:center;margin-bottom:42px}
.section-head h2{font-size:clamp(28px,3vw,40px);letter-spacing:-0.02em}
.section-head p{color:var(--sub);margin-top:10px;max-width:720px;margin-inline:auto}

/* ========= Header ========= */
.header{
  position:sticky;top:0;z-index:50;
  backdrop-filter: blur(14px);
  background:linear-gradient(to bottom, rgba(0,0,0,0.35), transparent);
  border-bottom:1px solid var(--border);
}
.header-inner{
  display:flex;justify-content:space-between;align-items:center;
  padding:14px 0;gap:16px;
}
.brand{display:flex;align-items:center;gap:12px}
.logo{
  width:42px;height:42px;border-radius:14px;
  background:linear-gradient(135deg,var(--primary),var(--accent));
  display:grid;place-items:center;font-weight:900;color:#0b1120;
  box-shadow:0 16px 35px rgba(0,0,0,0.25);
}
.brand-name{font-weight:900;letter-spacing:-0.02em}
.brand-tag{font-size:12px;color:var(--sub);margin-top:-2px}

.nav{display:flex;gap:14px;align-items:center}
.nav-link{
  color:var(--sub);font-weight:700;
  padding:8px 10px;border-radius:12px;
  transition:.2s ease;
}
.nav-link:hover{background:rgba(255,255,255,0.08);color:var(--text)}

.actions{display:flex;gap:10px;align-items:center}
.btn{
  display:inline-flex;align-items:center;justify-content:center;
  padding:12px 18px;border-radius:999px;font-weight:900;
  border:1px solid transparent;cursor:pointer;
  transition:transform .18s ease, box-shadow .18s ease, background .18s ease;
}
.btn-primary{
  background:linear-gradient(135deg,var(--primary),var(--accent));
  color:#0b1120;
  box-shadow:0 18px 55px rgba(0,0,0,0.25);
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 25px 70px rgba(0,0,0,0.35)}
.btn-ghost{
  background:rgba(255,255,255,0.06);
  border-color:var(--border);
  color:var(--text);
}
.btn-ghost:hover{transform:translateY(-2px);background:rgba(255,255,255,0.10)}
.theme-btn{
  width:44px;height:44px;border-radius:999px;
  border:1px solid var(--border);
  background:rgba(255,255,255,0.06);
  color:var(--text);
  cursor:pointer;transition:.18s ease;
}
.theme-btn:hover{transform:translateY(-2px);background:rgba(255,255,255,0.12)}

/* ========= Hero ========= */
.hero{
  padding:75px 0 30px;
  background:
    radial-gradient(900px 500px at 70% 30%, color-mix(in srgb, var(--primary) 22%, transparent), transparent 60%),
    radial-gradient(700px 500px at 25% 10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 60%);
}
.hero-grid{
  display:grid;grid-template-columns:1.1fr 0.9fr;
  gap:40px;align-items:center;
}
.badge{
  display:inline-flex;padding:8px 12px;border-radius:999px;
  background:rgba(255,255,255,0.08);
  border:1px solid var(--border);
  color:var(--muted);font-weight:800;font-size:13px;margin-bottom:14px;
}
.hero h1{font-size:clamp(34px,4vw,56px);line-height:1.05;letter-spacing:-0.03em}
.lead{color:var(--sub);margin-top:16px;font-size:16px;max-width:600px}
.hero-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
.mockup{
  position:relative;border-radius:22px;overflow:hidden;
  border:1px solid var(--border);
  background:rgba(255,255,255,0.06);
  box-shadow:var(--shadow);
}
.mockup img{width:100%;height:430px;object-fit:cover;filter:saturate(1.1) contrast(1.05);transform:scale(1.02)}
.floating{
  position:absolute;display:flex;gap:10px;align-items:center;
  background:rgba(2,6,23,0.55);
  border:1px solid rgba(255,255,255,0.14);
  color:#fff;padding:12px 14px;border-radius:16px;
  backdrop-filter: blur(12px);
  box-shadow:0 20px 55px rgba(0,0,0,0.40);
  animation:floaty 4.2s ease-in-out infinite;
}
.floating .t{font-weight:900;font-size:13px}
.floating .s{font-size:12px;opacity:.85}
.f1{right:16px;top:18px}
.f2{left:16px;bottom:18px;animation-delay:1.1s}
@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}

/* ========= Cards ========= */
.cards-grid{
  display:grid;grid-template-columns:repeat(3,1fr);gap:18px;
}
.card{
  background:var(--card);
  border:1px solid var(--border);
  border-radius:18px;padding:22px;
  backdrop-filter: blur(16px);
  transition:transform .2s ease,border-color .2s ease,background .2s ease;
}
.card:hover{
  transform:translateY(-6px);
  border-color:color-mix(in srgb, var(--primary) 55%, transparent);
}
.card-top{display:flex;gap:12px;align-items:center;margin-bottom:12px}
.card-icon{
  width:44px;height:44px;border-radius:14px;display:grid;place-items:center;
  background:color-mix(in srgb, var(--primary) 14%, transparent);
  border:1px solid color-mix(in srgb, var(--primary) 25%, transparent);
  font-size:20px;
}
.card h3{font-size:18px;letter-spacing:-0.01em}
.card p{color:var(--sub);margin-top:6px}

/* ========= Why ========= */
.why-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.why-item{
  background:rgba(255,255,255,0.06);
  border:1px solid var(--border);
  border-radius:18px;padding:22px;
  transition:.2s ease;
}
.why-item:hover{transform:translateY(-6px);border-color:color-mix(in srgb, var(--primary) 55%, transparent)}
.why-title{font-weight:900;margin-bottom:8px}
.why-desc{color:var(--sub)}

/* ========= Contact ========= */
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}
.contact-left p{color:var(--sub);margin-top:10px;max-width:560px}
.contact-points{margin-top:16px;display:grid;gap:8px;color:var(--muted)}
.form{
  background:rgba(255,255,255,0.06);
  border:1px solid var(--border);
  border-radius:18px;padding:22px;
}
.field-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.field label{display:block;font-size:13px;font-weight:900;color:var(--muted);margin-bottom:6px}
.field input,.field textarea{
  width:100%;padding:12px;border-radius:12px;
  border:1px solid var(--border);
  background:rgba(0,0,0,0.10);
  color:var(--text);outline:none;
}
body[data-theme="light"] .field input,
body[data-theme="light"] .field textarea{background:#fff}
.field textarea{min-height:120px;resize:vertical}
.note{margin-top:10px;color:var(--sub);font-size:12px}

/* ========= Footer ========= */
.footer{border-top:1px solid var(--border);padding:35px 0 18px}
.footer-inner{display:flex;gap:20px;justify-content:space-between;flex-wrap:wrap}
.footer-title{font-weight:900;font-size:18px}
.footer-sub{color:var(--sub);margin-top:6px;max-width:560px}
.footer-bottom{color:var(--sub);margin-top:18px;padding-top:14px;border-top:1px solid var(--border);font-size:13px}

/* ========= Reveal ========= */
.reveal{opacity:0;transform:translateY(14px);transition:opacity .55s ease, transform .55s ease}
.reveal.shown{opacity:1;transform:translateY(0)}

/* ========= Responsive ========= */
@media (max-width: 980px){
  .hero-grid{grid-template-columns:1fr}
  .cards-grid{grid-template-columns:1fr}
  .why-grid{grid-template-columns:1fr}
  .contact-grid{grid-template-columns:1fr}
  .nav{display:none}
}
`;
}

function buildPageHTML({ page, businessName, description, nav, chosen, prompt }) {
  const pageTitleMap = {
    home: `${businessName} | Home`,
    services: `${businessName} | Services`,
    about: `${businessName} | About`,
    contact: `${businessName} | Contact`
  };

  const metaDescMap = {
    home: `Modern website for ${businessName}. SEO-ready, mobile responsive and built to convert.`,
    services: `Services by ${businessName}: web development, SEO and digital marketing.`,
    about: `About ${businessName} and our mission to deliver premium web experiences.`,
    contact: `Contact ${businessName} for website, SEO and marketing enquiries.`
  };

  const heroImg =
    chosen.id === "A"
      ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80"
      : "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1400&q=80";

  const servicesHtml = `
    <section class="section" id="services">
      <div class="container">
        <div class="section-head reveal">
          <h2>Our Services</h2>
          <p>SEO-first design and high-converting pages—built to grow your traffic and leads.</p>
        </div>
        <div class="cards-grid">
          ${[
            { icon: "🖥️", title: "Web Design & Development", desc: "Fast, modern, mobile-first websites designed to convert visitors into customers." },
            { icon: "🔍", title: "SEO Optimization", desc: "Technical SEO + on-page SEO + local SEO for higher Google rankings and qualified traffic." },
            { icon: "🚀", title: "Digital Marketing", desc: "Ads + funnels + social growth strategies that drive measurable ROI." }
          ]
            .map(
              (s) => `
              <div class="card reveal">
                <div class="card-top">
                  <div class="card-icon">${s.icon}</div>
                  <h3>${s.title}</h3>
                </div>
                <p>${s.desc}</p>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;

  const whyHtml = `
    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <h2>Why Choose Us?</h2>
          <p>${chosen.vibe}</p>
        </div>

        <div class="why-grid">
          ${[
            { title: "Premium Design", desc: "Modern UI, clean typography, and high-end visuals that build trust instantly." },
            { title: "SEO-Ready", desc: "Structured headings, fast loading, and content blocks optimized for ranking." },
            { title: "Conversion Focused", desc: "Strong CTAs, clear sections, and smart layouts to increase enquiries." }
          ]
            .map(
              (w) => `
              <div class="why-item reveal">
                <div class="why-title">✅ ${w.title}</div>
                <div class="why-desc">${w.desc}</div>
              </div>
            `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;

  const contactHtml = `
    <section class="section contact" id="contact">
      <div class="container contact-grid">
        <div class="contact-left reveal">
          <h2>Let’s Build Something Great</h2>
          <p>${description}</p>
          <div class="contact-points">
            <div>✅ Free consultation</div>
            <div>⚡ Fast turnaround</div>
            <div>📈 Growth-focused delivery</div>
          </div>
        </div>

        <div class="contact-right reveal">
          <div class="form">
            <div class="field-grid">
              <div class="field">
                <label>Name</label>
                <input type="text" placeholder="Your Name" />
              </div>
              <div class="field">
                <label>Email</label>
                <input type="email" placeholder="Your Email" />
              </div>
            </div>
            <div class="field">
              <label>Message</label>
              <textarea placeholder="Tell us about your project"></textarea>
            </div>
            <button class="btn btn-primary btn-full" type="button">Send Enquiry</button>
            <div class="note">This is a demo form. We’ll connect it to database later.</div>
          </div>
        </div>
      </div>
    </section>
  `;

  const homeBody = `
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-left reveal">
          <div class="badge">${chosen.tagline}</div>
          <h1>${businessName}</h1>
          <p class="lead">${description}</p>
          <div class="hero-cta">
            <a class="btn btn-primary" href="./contact.html">Get Started</a>
            <a class="btn btn-ghost" href="./services.html">View Services</a>
          </div>
        </div>

        <div class="hero-right reveal">
          <div class="mockup">
            <img src="${heroImg}" alt="Modern mockup" />
            <div class="floating f1">
              <div>⚡</div>
              <div>
                <div class="t">Fast</div>
                <div class="s">Optimized</div>
              </div>
            </div>
            <div class="floating f2">
              <div>📈</div>
              <div>
                <div class="t">SEO</div>
                <div class="s">Rank</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${servicesHtml}
    ${whyHtml}
    ${contactHtml}
  `;

  const servicesBody = `
    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <h2>Services</h2>
          <p>Everything you need to build, rank and grow online.</p>
        </div>
      </div>
    </section>
    ${servicesHtml}
    ${whyHtml}
    ${contactHtml}
  `;

  const aboutBody = `
    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <h2>About</h2>
          <p>We build modern websites and marketing systems that grow businesses.</p>
        </div>

        <div class="cards-grid">
          <div class="card reveal">
            <div class="card-top">
              <div class="card-icon">🏆</div>
              <h3>Our Mission</h3>
            </div>
            <p>Deliver premium, fast, and SEO-ready websites that help you win trust and generate leads.</p>
          </div>

          <div class="card reveal">
            <div class="card-top">
              <div class="card-icon">🧠</div>
              <h3>Our Approach</h3>
            </div>
            <p>We combine UI/UX + development + SEO + marketing to create complete growth systems.</p>
          </div>

          <div class="card reveal">
            <div class="card-top">
              <div class="card-icon">⚙️</div>
              <h3>Quality Delivery</h3>
            </div>
            <p>Clean code, responsive layouts, and a strong conversion structure—ready to deploy.</p>
          </div>
        </div>
      </div>
    </section>
    ${contactHtml}
  `;

  const contactBody = `
    <section class="section">
      <div class="container">
        <div class="section-head reveal">
          <h2>Contact</h2>
          <p>Share your requirements and we’ll respond within 24 hours.</p>
        </div>
      </div>
    </section>
    ${contactHtml}
  `;

  const pageBody =
    page === "home"
      ? homeBody
      : page === "services"
      ? servicesBody
      : page === "about"
      ? aboutBody
      : contactBody;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${pageTitleMap[page]}</title>
  <meta name="description" content="${metaDescMap[page]}" />
  <link rel="stylesheet" href="./styles.css" />
</head>

<body data-theme="dark">
  <header class="header">
    <div class="container header-inner">
      <div class="brand">
        <div class="logo">${businessName.slice(0, 1).toUpperCase()}</div>
        <div>
          <div class="brand-name">${businessName}</div>
          <div class="brand-tag">${chosen.name}</div>
        </div>
      </div>

      <nav class="nav">${nav}</nav>

      <div class="actions">
        <a class="btn btn-small btn-ghost" href="./contact.html">Enquire</a>
        <button class="theme-btn" id="themeToggle" type="button">🌙</button>
      </div>
    </div>
  </header>

  <main>${pageBody}</main>

  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <div class="footer-title">${businessName}</div>
        <div class="footer-sub">${safeText(prompt)}</div>
      </div>
    </div>
    <div class="container footer-bottom">© ${new Date().getFullYear()} ${businessName}. All rights reserved.</div>
  </footer>

  <script>
    const saved = localStorage.getItem("theme");
    document.body.dataset.theme = saved || "dark";
    const btn = document.getElementById("themeToggle");
    function syncIcon(){ btn.textContent = document.body.dataset.theme === "dark" ? "☀️" : "🌙"; }
    syncIcon();
    btn.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = next;
      localStorage.setItem("theme", next);
      syncIcon();
    });

    const els = document.querySelectorAll(".reveal");
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("shown");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  </script>
</body>
</html>`;
}

// --------------------
// Pages for the builder flow
// --------------------
app.get("/start", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Welcome to Eminent AI World</title>
  <link rel="stylesheet" href="/start.css" />
</head>
<body data-theme="dark">
  <div class="wrap">
    <div class="panel">
      <div class="pill">Eminent AI World</div>
      <h1>Get Your Website in Just One Prompt</h1>
      <p>Describe your business and what you want. We will generate 2 modern mockups for you to choose.</p>

      <div class="form">
        <label>Your Email (to send final website ZIP)</label>
        <input id="email" type="email" placeholder="you@example.com" />

        <label>Website Prompt</label>
        <textarea id="prompt" placeholder="Example: I need a website for a gym in Mumbai. Include memberships, trainers, contact form, and Google map."></textarea>

        <button id="gen" class="btn">Generate 2 Mockups</button>
        <div id="msg" class="msg"></div>
      </div>
    </div>

    <div class="panel">
      <h2>Your Mockups</h2>
      <p class="sub">Pick one to generate the full responsive website.</p>
      <div id="options" class="options"></div>
    </div>

    <div class="panel" id="nextPanel" style="display:none;">
      <h2>Preview & Next</h2>
      <p class="sub">Preview your generated site and proceed to payment.</p>
      <div class="actions">
        <a id="previewLink" class="btn2" href="#" target="_blank">Open Preview</a>
        <button id="payBtn" class="btn2 primary">Pay & Email ZIP</button>
      </div>
      <div id="payMsg" class="msg"></div>
    </div>
  </div>

  <script src="/start.js"></script>
</body>
</html>
  `);
});

// --------------------
// API: generate 2 mockups
// --------------------
app.post("/api/mockups", (req, res) => {
  const { prompt, email } = req.body || {};
  if (!prompt || !email) {
    return res.status(400).json({ error: "prompt and email are required" });
  }

  const jobId = uid();
  const { A, B } = buildMockupsFromPrompt(prompt);

  JOBS.set(jobId, {
    id: jobId,
    prompt,
    customerEmail: email,
    optionA: A,
    optionB: B,
    chosenOption: null,
    siteDir: null,
    payment: null
  });

  res.json({ jobId, options: [A, B] });
});

// --------------------
// API: generate site after user chooses option
// --------------------
app.post("/api/generate", (req, res) => {
  const { jobId, optionId } = req.body || {};
  const job = JOBS.get(jobId);
  if (!job) return res.status(404).json({ error: "job not found" });
  if (!optionId || !["A", "B"].includes(optionId)) {
    return res.status(400).json({ error: "optionId must be A or B" });
  }

  const chosen = optionId === "A" ? job.optionA : job.optionB;

  const { siteDir, siteId } = generateSiteFiles({
    jobId,
    prompt: job.prompt,
    chosen,
    customerEmail: job.customerEmail
  });

  job.chosenOption = chosen;
  job.siteDir = siteDir;

  // preview link served by backend
  const preview = `/preview/${siteId}/home`;

  res.json({ success: true, preview });
});

// --------------------
// Preview route: serves generated site files
// /preview/:jobId/home -> loads generated-sites/:jobId/home.html
// and styles.css
// --------------------
app.get("/preview/:jobId/:page?", (req, res) => {
  const { jobId, page = "home" } = req.params;
  const siteDir = path.join(__dirname, "generated-sites", jobId);

  const file = path.join(siteDir, `${page}.html`);
  if (!fs.existsSync(file)) return res.status(404).send("Preview not found");

  res.sendFile(file);
});

// Serve the generated styles.css as well
app.get("/preview/:jobId/styles.css", (req, res) => {
  const { jobId } = req.params;
  const file = path.join(__dirname, "generated-sites", jobId, "styles.css");
  if (!fs.existsSync(file)) return res.status(404).send("Not found");
  res.type("text/css").send(fs.readFileSync(file, "utf8"));
});

// --------------------
// Payment: create order (Razorpay)
// --------------------
app.post("/api/create-payment", async (req, res) => {
  try {
    mustEnv("RAZORPAY_KEY_ID", RAZORPAY_KEY_ID);
    mustEnv("RAZORPAY_KEY_SECRET", RAZORPAY_KEY_SECRET);

    const { jobId } = req.body || {};
    const job = JOBS.get(jobId);
    if (!job) return res.status(404).json({ error: "job not found" });

    // Example price: ₹999 (in paise)
    const amount = 99900;
    const currency = "INR";

    const razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `job_${jobId}`,
      notes: { jobId }
    });

    job.payment = { orderId: order.id, amount, currency };

    res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: order.id,
      amount,
      currency,
      jobId
    });
  } catch (err) {
    console.error("Payment create error:", err);
    res.status(500).json({ error: "failed to create payment order" });
  }
});

// --------------------
// Payment webhook (Razorpay) -> on success email ZIP to ADMIN_EMAIL
// --------------------

// Need raw body for signature verify
app.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      mustEnv("RAZORPAY_WEBHOOK_SECRET", RAZORPAY_WEBHOOK_SECRET);
      mustEnv("ADMIN_EMAIL", ADMIN_EMAIL);
      mustEnv("SMTP_HOST", SMTP_HOST);
      mustEnv("SMTP_USER", SMTP_USER);
      mustEnv("SMTP_PASS", SMTP_PASS);

      const signature = req.headers["x-razorpay-signature"];
      const expected = crypto
        .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex");

      if (signature !== expected) {
        return res.status(400).send("Invalid signature");
      }

      const payload = JSON.parse(req.body.toString("utf8"));

      // We care about payment captured
      if (payload.event !== "payment.captured") {
        return res.status(200).send("Ignored");
      }

      const orderId = payload?.payload?.payment?.entity?.order_id;
      const receipt = payload?.payload?.payment?.entity?.notes?.receipt; // may not exist
      const jobId = payload?.payload?.payment?.entity?.notes?.jobId;

      if (!jobId) return res.status(200).send("No jobId in notes");

      const job = JOBS.get(jobId);
      if (!job || !job.siteDir) return res.status(200).send("Job missing");

      // Create ZIP
      const zipPath = path.join(__dirname, "generated-sites", `${jobId}.zip`);
      await zipDirectory(job.siteDir, zipPath);

      // Email it to ADMIN
      await sendZipEmail({
        to: ADMIN_EMAIL,
        subject: `New AI Website ZIP (Job ${jobId})`,
        text: `Customer: ${job.customerEmail}\nPrompt:\n${job.prompt}\nOrder: ${orderId || ""}\n\nAttached: Website ZIP`,
        zipPath,
        filename: `website-${jobId}.zip`
      });

      // Cleanup zip file (optional)
      try { fs.unlinkSync(zipPath); } catch {}

      return res.status(200).send("OK");
    } catch (err) {
      console.error("Webhook error:", err);
      return res.status(500).send("Webhook error");
    }
  }
);

// --------------------
// Helpers: zip + email
// --------------------
function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function sendZipEmail({ to, subject, text, zipPath, filename }) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from: SMTP_USER,
    to,
    subject,
    text,
    attachments: [{ filename, path: zipPath }]
  });
}

// --------------------
// Start server
// --------------------
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
