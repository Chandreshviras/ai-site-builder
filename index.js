import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

/* --------------------
   APP SETUP
-------------------- */
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* --------------------
   ENV CHECK (SAFE LOGS)
-------------------- */
console.log("SUPABASE_URL exists:", !!process.env.SUPABASE_URL);
console.log("SUPABASE_SERVICE_KEY exists:", !!process.env.SUPABASE_SERVICE_KEY);

/* --------------------
   SUPABASE CLIENT
-------------------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

/* --------------------
   HEALTH CHECK
-------------------- */
app.get("/", (req, res) => {
  res.send("AI Site Builder running");
});

/* --------------------
   SECTION RENDERER
-------------------- */
function renderSection(section) {
  switch (section.type) {
    case "hero":
      return `
        <section class="hero">
          <h1>${section.heading}</h1>
          <p>${section.subheading}</p>
          <a href="#contact" class="cta">${section.cta}</a>
        </section>
      `;

    case "services":
      return `
        <section class="services">
          <h2>Our Services</h2>
          <div class="service-grid">
            ${section.items
              .map(
                s => `
              <div class="service-card">
                <h3>${s.title}</h3>
                <p>${s.description}</p>
              </div>
            `
              )
              .join("")}
          </div>
        </section>
      `;

    case "about":
      return `
        <section class="about">
          <h2>About Us</h2>
          <p>${section.content}</p>
        </section>
      `;

    case "contact":
      return `
        <section class="contact" id="contact">
          <h2>Contact Us</h2>
          <form>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Email Address" required />
            <textarea placeholder="Tell us about your project"></textarea>
            <button type="submit">Send Message</button>
          </form>
        </section>
      `;

    default:
      return "";
  }
}

/* --------------------
   USER SITE RENDER
-------------------- */
app.get("/site/:id/:page?", async (req, res) => {
  try {
    const { id, page = "home" } = req.params;

    const { data, error } = await supabase
      .from("sites")
      .select("json")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).send("Site not found");
    }

    const site = data.json;

    /* Map pages */
    const pagesMap = {};
    site.pages.forEach(p => {
      pagesMap[p.title.toLowerCase()] = p.sections;
    });

    if (!pagesMap[page]) {
      return res.status(404).send("Page not found");
    }

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${site.business_name}</title>
  <meta name="description" content="${site.business_description || ""}">
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="/style.css" />
  <script>
    function toggleTheme() {
      const t = document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = t;
      localStorage.setItem("theme", t);
    }
    window.onload = () => {
      document.body.dataset.theme = localStorage.getItem("theme") || "light";
    };
  </script>
</head>

<body data-theme="light">
<header class="header">
  <h1>${site.business_name}</h1>
  <p>${site.business_description || ""}</p>

  <nav>
    ${Object.keys(pagesMap)
      .map(p => `<a href="/site/${id}/${p}">${p}</a>`)
      .join("")}
  </nav>

  <button onclick="toggleTheme()">🌙 / ☀️</button>
</header>

<main>
  ${pagesMap[page].map(renderSection).join("")}
</main>

<footer class="footer">
  © ${new Date().getFullYear()} ${site.business_name}
</footer>
</body>
</html>
    `);
  } catch (err) {
    console.error("Render error:", err);
    res.status(500).send("Server error");
  }
});

/* --------------------
   SERVER START
-------------------- */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
