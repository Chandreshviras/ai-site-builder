import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files (CSS must be here)
app.use(express.static(path.join(__dirname, "public")));

// Home (root)
app.get("/", (req, res) => {
  res.redirect("/site/demo/home");
});

// ✅ Dynamic site home route (THIS fixes your error)
app.get("/site/:siteId/home", (req, res) => {
  const { siteId } = req.params;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Eminent Website Solutions</title>

      <!-- IMPORTANT: absolute path -->
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body class="light">
      <header>
        <h1>Eminent Website Solutions</h1>
        <p>Web design & digital marketing agency</p>

        <nav>
          <a href="/site/${siteId}/home">Home</a>
          <a href="#">About</a>
          <a href="#">Contact</a>
        </nav>
      </header>

      <main class="card">
        <h2>Site ID</h2>
        <p><strong>${siteId}</strong></p>

        <p>
          We build high-performance websites, SEO strategies, and digital
          marketing systems for growing businesses.
        </p>
      </main>

      <footer>
        © 2026 Eminent Website Solutions
      </footer>
    </body>
    </html>
  `);
});

// Health check (Render)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
