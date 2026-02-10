import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// --------------------
// APP SETUP
// --------------------
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// --------------------
// ENV CHECK (SAFE LOGS)
// --------------------
console.log("SUPABASE_URL exists:", !!process.env.SUPABASE_URL);
console.log("SUPABASE_ANON_KEY exists:", !!process.env.SUPABASE_ANON_KEY);

// --------------------
// SUPABASE CLIENT (FIXED)
// --------------------
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// --------------------
// HEALTH CHECK
// --------------------
app.get("/", (req, res) => {
  res.send("AI Site Builder running");
});

// --------------------
// USER SITE RENDER (MULTI PAGE + THEME)
// --------------------
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

    // Pages map
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
  <link rel="stylesheet" href="/styles.css" />

  <script>
    function toggleTheme() {
      const theme =
        document.body.dataset.theme === "dark" ? "light" : "dark";
      document.body.dataset.theme = theme;
      localStorage.setItem("theme", theme);
    }

    window.onload = () => {
      document.body.dataset.theme =
        localStorage.getItem("theme") || "${site.theme || "light"}";
    };
  </script>
</head>

<body data-theme="${site.theme || "light"}">

<header>
  <h1>${site.business_name}</h1>
  <p>${site.business_description || ""}</p>

  <nav>
    ${Object.keys(pagesMap)
      .map(p => `<a href="/site/${id}/${p}">${p}</a>`)
      .join("")}
  </nav>

  <button onclick="toggleTheme()">🌙 / ☀️</button>
</header>

<main class="content">
  <h2>${page.toUpperCase()}</h2>
  <ul>
    ${pagesMap[page].map(s => `<li>${s}</li>`).join("")}
  </ul>
</main>

<footer>
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

// --------------------
// SERVER START (RENDER SAFE)
// --------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
