import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   ENV
========================= */
const PORT = process.env.PORT || 10000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/* =========================
   CLIENTS
========================= */
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   HEALTH
========================= */
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* =========================
   STEP 6 — GENERATE SITE
========================= */
app.post("/generate-site", async (req, res) => {
  try {
    const {
      customer_id,
      business_name,
      business_description,
      industry,
      location,
    } = req.body;

    if (!customer_id || !business_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
You are an expert AI website builder.

Create a professional business website in JSON.

Business Name: ${business_name}
Description: ${business_description}
Industry: ${industry}
Location: ${location}

Return ONLY valid JSON in this format:

{
  "theme": { "primary": "#111111" },
  "pages": [
    {
      "slug": "home",
      "sections": [
        { "type": "hero", "heading": "", "subheading": "" },
        { "type": "services", "items": [] },
        { "type": "contact", "email": "", "phone": "" }
      ]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const siteJson = JSON.parse(
      completion.choices[0].message.content
    );

    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          customer_id,
          name: business_name,
          json: siteJson,
          status: "live",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Database insert failed" });
    }

    res.json({
      success: true,
      site_id: data.id,
      site_json: siteJson,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

/* =========================
   START
========================= */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
