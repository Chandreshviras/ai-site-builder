import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// PATH SETUP (ESM SAFE)
// --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ PRODUCTION READY STATIC (Render safe)
app.use(express.static(path.join(__dirname, "public")));

// --------------------
// ENV
// --------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Quick check (SAFE)
console.log("SUPABASE_URL exists:", !!SUPABASE_URL);
console.log("SUPABASE_SERVICE_KEY exists:", !!SUPABASE_SERVICE_KEY);

// --------------------
// SUPABASE CLIENT
// --------------------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --------------------
// ROUTES
// --------------------
app.get("/", (req, res) => {
  res.send("AI Site Builder running ✅");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Multi-page user-side rendering
// /site/:id -> defaults to home
// /site/:id/home | /site/:id/services | /site/:id/about | /site/:id/contact
app.get("/site/:id/:page?", async (req, res) => {
  try {
    const { id, page = "home" } = req.params;

    const { data, error } = await supabase
      .from("sites")
      .select("id, name, json")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).send("Site not found");
    }

    const site = data.json || {};
    const businessName = site.business_name || data.name || "Business";
    const businessDesc =
      site.business_description ||
      "We build modern websites, SEO strategies and digital marketing systems for growing businesses.";
    const location = site.location || "Mumbai, India";

    // Pages (fallback if missing)
    const pages = {
      home: true,
      services: true,
      about: true,
      contact: true
    };

    if (!pages[page]) return res.status(404).send("Page not found");

    // Services (SEO-rich)
    const services = [
      {
        title: "Web Design & Development",
        desc: "Conversion-focused, mobile-first, lightning-fast websites built for lead generation and brand trust."
      },
      {
        title: "SEO Optimization",
        desc: "Technical SEO, on-page SEO, local SEO and content strategy to rank higher on Google and drive qualified traffic."
      },
      {
        title: "Digital Marketing",
        desc: "Performance marketing, Google Ads, Meta ads, social media strategy and funnels that generate measurable ROI."
      }
    ];

    const whyChoose = [
      {
        title: "Expert Team",
        desc: "Specialists in UI/UX, SEO, development and performance marketing working together end-to-end."
      },
      {
        title: "Tailored Strategy",
        desc: "We craft a custom growth plan based on your industry, competitors, audience and goals."
      },
      {
        title: "Proven Results",
        desc: "We focus on outcomes—more leads, better conversions, stronger rankings and lower acquisition costs."
      }
    ];

    const canonical = `/site/${id}/${page}`;

    // Dynamic Page content blocks
    const pageTitleMap = {
      home: `${businessName} | Web Design & Digital Marketing`,
      services: `${businessName} | Services`,
      about: `${businessName} | About`,
      contact: `${businessName} | Contact`
    };

    const metaDescMap = {
      home: `${businessName} helps businesses grow with modern website design, SEO and digital marketing. Based in ${location}.`,
      services: `Explore ${businessName} services: web development, SEO optimization, and digital marketing to grow traffic and leads.`,
      about: `Learn about ${businessName}—our mission, approach and why businesses choose us for growth.`,
      contact: `Contact ${businessName} to discuss your website, SEO or marketing project. Get a free consultation.`
    };

    // ✅ Page body generator (modern layout)
    const renderHome = () => `
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-left reveal">
            <div class="badge">AI-powered • SEO-first • Conversion focused</div>
            <h1>Build Stunning Websites for Your Business</h1>
            <p class="lead">
              Premium web design & digital marketing solutions for businesses looking to dominate their online presence.
              Get a modern website, SEO-rich content and a growth system—built to convert.
            </p>
            <div class="hero-cta">
              <a class="btn btn-primary" href="/site/${id}/contact">Get Started</a>
              <a class="btn btn-ghost" href="/site/${id}/services">View Services</a>
            </div>

            <div class="trust">
              <div class="trust-item">
                <div class="trust-num">5+</div>
                <div class="trust-text">Years experience</div>
              </div>
              <div class="trust-item">
                <div class="trust-num">100+</div>
                <div class="trust-text">Projects delivered</div>
              </div>
              <div class="trust-item">
                <div class="trust-num">ROI</div>
                <div class="trust-text">Growth focused</div>
              </div>
            </div>
          </div>

          <div class="hero-right reveal">
            <div class="mockup">
              <div class="mockup-glow"></div>
              <img
                alt="Modern website mockup"
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
              />
              <div class="floating-card f1">
                <div class="icon">⚡</div>
                <div>
                  <div class="t">Fast Performance</div>
                  <div class="s">Optimized pages</div>
                </div>
              </div>
              <div class="floating-card f2">
                <div class="icon">📈</div>
                <div>
                  <div class="t">SEO Growth</div>
                  <div class="s">Rank & convert</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="services">
        <div class="container">
          <div class="section-head reveal">
            <h2>Our Services</h2>
            <p>High-impact services that help you attract traffic, convert visitors, and scale revenue.</p>
          </div>

          <div class="cards-grid">
            ${services
              .map(
                (s, idx) => `
                <div class="card reveal" style="animation-delay:${idx * 0.08}s">
                  <div class="card-top">
                    <div class="card-icon">${idx === 0 ? "🖥️" : idx === 1 ? "🔍" : "🚀"}</div>
                    <h3>${s.title}</h3>
                  </div>
                  <p>${s.desc}</p>
                  <a class="card-link" href="/site/${id}/contact">Request a Quote →</a>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="section why" id="about">
        <div class="container">
          <div class="section-head reveal">
            <h2>Why Choose Us?</h2>
            <p>We combine design, development, SEO and marketing into one growth-focused delivery system.</p>
          </div>

          <div class="why-grid">
            ${whyChoose
              .map(
                (w, idx) => `
                <div class="why-item reveal" style="animation-delay:${idx * 0.08}s">
                  <div class="why-title">✅ ${w.title}</div>
                  <div class="why-desc">${w.desc}</div>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      </section>

      <section class="section contact" id="contact">
        <div class="container contact-grid">
          <div class="contact-left reveal">
            <h2>Let’s Build Something Great</h2>
            <p>
              Share your goals and we’ll suggest a roadmap: website + SEO + marketing plan tailored for your business.
              Based in <strong>${location}</strong>.
            </p>

            <div class="contact-points">
              <div>📍 ${location}</div>
              <div>⏱️ Response within 24 hours</div>
              <div>✅ Free consultation</div>
            </div>
          </div>

          <div class="contact-right reveal">
            <form class="contact-form" method="POST" action="#">
              <div class="field-grid">
                <div class="field">
                  <label>Name</label>
                  <input name="name" type="text" placeholder="Your Name" required />
                </div>
                <div class="field">
                  <label>Email</label>
                  <input name="email" type="email" placeholder="Your Email" required />
                </div>
              </div>

              <div class="field">
                <label>Project</label>
                <textarea name="message" placeholder="Tell us about your project (website / SEO / marketing)"></textarea>
              </div>

              <button class="btn btn-primary btn-full" type="submit">
                Send Enquiry
              </button>

              <div class="form-note">
                By submitting, you agree to be contacted about your request.
              </div>
            </form>
          </div>
        </div>
      </section>
    `;

    const renderServices = () => `
      <section class="page-hero">
        <div class="container">
          <h1>Services</h1>
          <p>Everything you need to build, rank and scale your online presence.</p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="cards-grid">
            ${services
              .map(
                (s, idx) => `
                <div class="card reveal" style="animation-delay:${idx * 0.08}s">
                  <div class="card-top">
                    <div class="card-icon">${idx === 0 ? "🖥️" : idx === 1 ? "🔍" : "🚀"}</div>
                    <h3>${s.title}</h3>
                  </div>
                  <p>${s.desc}</p>
                  <ul class="list">
                    ${
                      idx === 0
                        ? `<li>UI/UX Design</li><li>Responsive Development</li><li>Speed Optimization</li>`
                        : idx === 1
                        ? `<li>Technical SEO</li><li>On-page SEO</li><li>Local SEO</li>`
                        : `<li>Google Ads</li><li>Meta Ads</li><li>Social Growth</li>`
                    }
                  </ul>
                </div>
              `
              )
              .join("")}
          </div>
        </div>
      </section>
    `;

    const renderAbout = () => `
      <section class="page-hero">
        <div class="container">
          <h1>About</h1>
          <p>We help businesses grow with design, technology and marketing that actually works.</p>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="about-grid">
            <div class="about-card reveal">
              <h2>Our Mission</h2>
              <p>
                Build modern, SEO-optimized websites and marketing systems that turn visitors into customers.
                We focus on clarity, speed, and measurable growth.
              </p>
              <p>
                From strategy to design, development to SEO, we deliver a complete website system that supports business growth.
              </p>
            </div>

            <div class="about-card reveal">
              <h2>What You Get</h2>
              <ul class="list">
                <li>Modern agency-grade website UI</li>
                <li>SEO-first structure and content</li>
                <li>Conversion-focused layout & CTAs</li>
                <li>Performance optimization</li>
                <li>Marketing roadmap & execution</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    `;

    const renderContact = () => `
      <section class="page-hero">
        <div class="container">
          <h1>Contact</h1>
          <p>Tell us what you need. We’ll respond within 24 hours.</p>
        </div>
      </section>

      <section class="section contact">
        <div class="container contact-grid">
          <div class="contact-left reveal">
            <h2>Start a Project</h2>
            <p>Get a free consultation for website design, SEO, and digital marketing.</p>
            <div class="contact-points">
              <div>📍 ${location}</div>
              <div>✅ Strategy + execution</div>
              <div>⚡ Fast turnaround</div>
            </div>
          </div>

          <div class="contact-right reveal">
            <form class="contact-form" method="POST" action="#">
              <div class="field-grid">
                <div class="field">
                  <label>Name</label>
                  <input name="name" type="text" placeholder="Your Name" required />
                </div>
                <div class="field">
                  <label>Email</label>
                  <input name="email" type="email" placeholder="Your Email" required />
                </div>
              </div>

              <div class="field">
                <label>Message</label>
                <textarea name="message" placeholder="Tell us about your project"></textarea>
              </div>

              <button class="btn btn-primary btn-full" type="submit">
                Send Enquiry
              </button>
              <div class="form-note">We’ll never share your details.</div>
            </form>
          </div>
        </div>
      </section>
    `;

    let bodyHtml = "";
    if (page === "home") bodyHtml = renderHome();
    if (page === "services") bodyHtml = renderServices();
    if (page === "about") bodyHtml = renderAbout();
    if (page === "contact") bodyHtml = renderContact();

    // ✅ Final HTML response
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${pageTitleMap[page]}</title>
  <meta name="description" content="${metaDescMap[page]}" />
  <meta name="keywords" content="web design agency Mumbai, SEO services, digital marketing agency India, website development company, performance marketing, Shopify development" />

  <link rel="stylesheet" href="/styles.css" />
  <link rel="canonical" href="${canonical}" />
</head>

<body data-theme="dark">
  <header class="header">
    <div class="container header-inner">
      <div class="brand">
        <div class="logo">E</div>
        <div class="brand-text">
          <div class="brand-name">${businessName}</div>
          <div class="brand-tag">Web Design • SEO • Marketing</div>
        </div>
      </div>

      <nav class="nav">
        <a class="${page === "home" ? "active" : ""}" href="/site/${id}/home">Home</a>
        <a class="${page === "services" ? "active" : ""}" href="/site/${id}/services">Services</a>
        <a class="${page === "about" ? "active" : ""}" href="/site/${id}/about">About</a>
        <a class="${page === "contact" ? "active" : ""}" href="/site/${id}/contact">Contact</a>
      </nav>

      <div class="actions">
        <a class="btn btn-small btn-ghost" href="/site/${id}/contact">Get Started</a>
        <button class="theme-btn" id="themeToggle" type="button" aria-label="Toggle theme">🌙</button>
      </div>
    </div>
  </header>

  <main>
    ${bodyHtml}
  </main>

  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <div class="footer-title">${businessName}</div>
        <div class="footer-sub">${businessDesc}</div>
      </div>

      <div class="footer-cols">
        <div>
          <div class="footer-head">Menu</div>
          <a href="/site/${id}/home">Home</a>
          <a href="/site/${id}/services">Services</a>
          <a href="/site/${id}/about">About</a>
          <a href="/site/${id}/contact">Contact</a>
        </div>
        <div>
          <div class="footer-head">Contact</div>
          <span>${location}</span>
          <span>hello@yourdomain.com</span>
          <span>+91 00000 00000</span>
        </div>
      </div>
    </div>

    <div class="container footer-bottom">
      © ${new Date().getFullYear()} ${businessName}. All rights reserved.
    </div>
  </footer>

  <script>
    // Theme
    const saved = localStorage.getItem("theme");
    document.body.dataset.theme = saved || "dark";
    const btn = document.getElementById("themeToggle");

    function syncIcon() {
      btn.textContent = document.body.dataset.theme === "dark" ? "☀️" : "🌙";
    }
    syncIcon();

    btn.addEventListener("click", () => {
      const next = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = next;
      localStorage.setItem("theme", next);
      syncIcon();
    });

    // Reveal on scroll
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
</html>
    `);
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).send("Server error");
  }
});

// --------------------
// SERVER START (RENDER SAFE)
// --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));
