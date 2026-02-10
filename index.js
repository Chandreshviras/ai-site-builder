import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve static files (CSS, images, JS)
app.use(express.static(path.join(__dirname, "public")));

// Home page
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Eminent Website Solutions</title>

      <!-- ✅ CSS MUST be absolute path -->
      <link rel="stylesheet" href="/style.css" />
    </head>
    <body class="light">
      <header>
        <h1>Eminent Website Solutions</h1>
        <p>Web design & digital marketing agency</p>

        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        </nav>
      </header>

      <main class="card">
        <h2>Welcome</h2>
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

// Health check (Render friendly)
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
