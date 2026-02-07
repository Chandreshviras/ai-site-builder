import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ROOT ROUTE
app.get("/", (req, res) => {
  res.status(200).send("AI Backend is running");
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// TEST GENERATE API
app.post("/generate-site", async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Generate site API working"
  });
});

app.get("/site/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).send("Site not found");
    }

    if (data.status !== "live") {
      return res.send("<h1>Site Under Maintenance</h1>");
    }

    const site = data.json;

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.name}</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { color: ${site.theme.primary}; }
        </style>
      </head>
      <body>
    `;

    site.pages[0].sections.forEach((section) => {
      if (section.type === "hero") {
        html += `<h1>${section.heading}</h1><p>${section.text}</p>`;
      }

      if (section.type === "services") {
        html += "<ul>";
        section.items.forEach((item) => {
          html += `<li>${item}</li>`;
        });
        html += "</ul>";
      }

      if (section.type === "contact") {
        html += `<p>Contact: ${section.email}</p>`;
      }
    });

    html += "</body></html>";

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Render error");
  }
});


// IMPORTANT: LISTEN
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
