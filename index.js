import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔹 INIT SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// 🔹 INIT OPENAI (THIS WAS MISSING ❗)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ ROOT
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

// ✅ HEALTH
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 🔥 GENERATE SITE API
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
Create a website structure in JSON.

Business: ${business_name}
Description: ${business_description}
Industry: ${industry}
Location: ${location}

Return JSON ONLY in this format:
{
  "theme": { "primary": "#000", "secondary": "#fff" },
  "pages": [
    {
      "slug": "home",
      "sections": [
        { "type": "hero", "heading": "...", "text": "..." },
        { "type": "services", "items": ["Service 1", "Service 2"] },
        { "type": "contact", "email": "info@example.com" }
      ]
    }
  ]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
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
      .select();

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(500).json({ error });
    }

    res.json({
      success: true,
      site: data[0],
    });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🚀 START SERVER
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);
