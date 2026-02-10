import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// --------------------
// APP SETUP
// --------------------
const app = express();
app.use(cors());
app.use(express.json());

console.log("🔥 INDEX.JS LOADED");

// --------------------
// ENV VARIABLES
// --------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// --------------------
// SUPABASE CLIENT
// --------------------
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);

// --------------------
// ROUTES
// --------------------

// Root
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// --------------------
// GENERATE SITE
// --------------------
app.post("/generate-site", async (req, res) => {
  try {
    const {
      customer_id,
      business_name,
      business_description,
      industry,
      location
    } = req.body;

    if (!customer_id || !business_name) {
      return res.status(400).json({
        error: "customer_id and business_name are required"
      });
    }

    const site_config = {
      business_name,
      business_description,
      industry,
      location,
      pages: [
        { title: "Home", sections: ["Hero", "Services", "CTA"] },
        { title: "About", sections: ["Company Info", "Mission"] },
        { title: "Contact", sections: ["Form", "Map"] }
      ]
    };

    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          customer_id,
          name: business_name,
          json: site_config,
          status: "live"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to save site" });
    }

    res.json({
      success: true,
      site_id: data.id,
      message: "Site generated successfully"
    });
  } catch (err) {
    console.error("Generate site error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --------------------
// SITE RENDERER (🔥 THIS WAS MISSING)
// --------------------
app.get("/site/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("sites")
      .select("name, json")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).send("Site not found");
    }

    const site = data.json;

    // Simple HTML render (basic for now)
    const html = `
      <html>
        <head>
          <title>${site.business_name}</title>
        </head>
        <body>
          <h1>${site.business_name}</h1>
          <p>${site.business_description || ""}</p>

          <h2>Pages</h2>
          <ul>
            ${site.pages
              .map(page => `<li>${page.title}</li>`)
              .join("")}
          </ul>
        </body>
      </html>
    `;

    res.send(html);
  } catch (err) {
    console.error("Site render error:", err);
    res.status(500).send("Server error");
  }
});

// --------------------
// SERVER START (MUST BE LAST)
// --------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
