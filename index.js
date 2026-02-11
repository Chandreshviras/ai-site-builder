import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve CSS correctly
app.use("/",
  express.static(path.join(__dirname, "public")), {
    extensions: ["css", "js", "png", "jpg", "jpeg", "gif", "svg"]
  })
);


// Redirect root
app.get("/", (req, res) => {
  res.redirect("/site/demo/home");
});

// ✅ Homepage route
app.get("/site/:siteId/home", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Eminent Website Solutions | Web Design & Digital Marketing Agency</title>

  <!-- SEO -->
  <meta name="description" content="Eminent Website Solutions is a Mumbai-based web design and digital marketing agency offering SEO, website development, branding, and performance marketing services." />
  <meta name="keywords" content="web design agency Mumbai, SEO services, digital marketing agency India, website development company" />

  <!-- CSS -->
  <link rel="stylesheet" href="/styles.css">
</head>

<body class="light">

<header class="header">
  <h1>Eminent Website Solutions</h1>
  <p>Web Design & Digital Marketing Agency</p>

  <nav>
    <a href="/site/demo/home">Home</a>
    <a href="#">Services</a>
    <a href="#">About</a>
    <a href="#">Contact</a>
  </nav>
</header>

<section class="hero container">
  <div class="hero-text">
    <h2>Build Stunning Websites for Your Business</h2>
    <p>
      Premium web design & digital marketing solutions for businesses
      looking to dominate online presence.
    </p>
    <a href="#" class="btn-primary">Generate My Site</a>
  </div>

  <img src="https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80" />
</section>


<section class="services">
  <h2>Our Services</h2>

  <div class="grid">
    <div class="card">
      <h3>Website Design & Development</h3>
      <p>Modern, fast, mobile-first websites built for conversions and scalability.</p>
    </div>

    <div class="card">
      <h3>SEO & Organic Growth</h3>
      <p>Data-driven SEO strategies to increase rankings, traffic, and revenue.</p>
    </div>

    <div class="card">
      <h3>Digital Marketing</h3>
      <p>Performance marketing, Google Ads, and social media growth campaigns.</p>
    </div>

    <div class="card">
      <h3>E-commerce Solutions</h3>
      <p>High-converting Shopify and custom e-commerce website development.</p>
    </div>
  </div>
</section>

<section class="contact">
  <h2>Let’s Build Something Great</h2>

  <form>
    <input type="text" placeholder="Your Name" required />
    <input type="email" placeholder="Your Email" required />
    <textarea placeholder="Tell us about your project"></textarea>
    <button type="submit">Send Enquiry</button>
  </form>
</section>

<footer>
  © 2026 Eminent Website Solutions. All Rights Reserved.
</footer>

</body>
</html>
  `);
});

// Health check
app.get("/health", (_, res) => res.send("OK"));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
