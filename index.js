import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// --------------------
// APP SETUP
// --------------------
const app = express();
app.use(cors());
app.use(express.json());

// --------------------
// ENV VARIABLES
// --------------------
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// --------------------
// SUPABASE CLIENT
// --------------------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --------------------
// ROUTES
// --------------------

// Root check
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Generate site API
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

    // MOCK AI SITE CONFIG (we’ll replace with OpenAI later)
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

    // INSERT INTO SUPABASE (CORRECT COLUMN: json)
    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          customer_id,
          name: business_name,
          json: site_config, // ✅ CORRECT
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
// SERVER START
// --------------------
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
