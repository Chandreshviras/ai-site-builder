import express from "express";
import { createClient } from "@supabase/supabase-js";

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(express.static("public"));

app.get("/site/:id/:page?", async (req, res) => {
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
  const content = site.pages[page];

  if (!content) {
    return res.status(404).send("Page not found");
  }

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${site.business_name}</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body class="${site.theme}">

<header>
  <h1>${site.business_name}</h1>
  <p>${site.business_description}</p>

  <nav>
    <a href="/site/${id}">Home</a>
    <a href="/site/${id}/about">About</a>
    <a href="/site/${id}/services">Services</a>
    <a href="/site/${id}/contact">Contact</a>
  </nav>
</header>

<main class="card">
  <h2>${page.toUpperCase()}</h2>
  <p>${content}</p>
</main>

<footer>
  © ${new Date().getFullYear()} ${site.business_name}
</footer>

</body>
</html>
  `);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
