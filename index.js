import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// SUPABASE CLIENT
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =========================
// ROOT CHECK
// =========================
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// GENERATE SITE (MOCK AI)
// =========================
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
      return res.status(400).json({ error: "Missing required fields" });
    }

    // -------------------------
    // MOCK AI RESPONSE
    // -------------------------
    const site_json = {
      theme: {
        primary: "#0f172a",
        secondary: "#f8fafc"
      },
      pages: [
        {
          slug: "home",
          sections: [
            {
              type: "hero",
              heading: business_name,
              text: business_description
            },
            {
              type: "services",
              items: [
                "Website Design",
                "SEO Optimization",
                "Digital Marketing"
              ]
            },
            {
              type: "contact",
              location: location,
              industry: industry
            }
          ]
        }
      ]
    };

    // -------------------------
    // INSERT SITE
    // -------------------------
    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          customer_id,
          name: business_name,
          config: site_json,
          status: "active"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to save site" });
    }

    res.json({
      success: true,
      site_id: data.id,
      message: "Site generated (mock AI)"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// =========================
// SUPABASE CLIENT
// =========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =========================
// ROOT CHECK
// =========================
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

// =========================
// HEALTH CHECK
// =========================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// =========================
// GENERATE SITE (MOCK AI)
// =========================
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
      return res.status(400).json({ error: "Missing required fields" });
    }

    // -------------------------
    // MOCK AI RESPONSE
    // -------------------------
    const site_json = {
      theme: {
        primary: "#0f172a",
        secondary: "#f8fafc"
      },
      pages: [
        {
          slug: "home",
          sections: [
            {
              type: "hero",
              heading: business_name,
              text: business_description
            },
            {
              type: "services",
              items: [
                "Website Design",
                "SEO Optimization",
                "Digital Marketing"
              ]
            },
            {
              type: "contact",
              location: location,
              industry: industry
            }
          ]
        }
      ]
    };

    // -------------------------
    // INSERT SITE
    // -------------------------
    const { data, error } = await supabase
      .from("sites")
      .insert([
        {
          customer_id,
          name: business_name,
          config: site_json,
          status: "active"
        }
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to save site" });
    }

    res.json({
      success: true,
      site_id: data.id,
      message: "Site generated (mock AI)"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
