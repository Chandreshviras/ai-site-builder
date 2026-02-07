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
  try {
    const {
      customer_id,
      business_name,
      business_description,
      industry,
      location,
    } = req.body;

    console.log("Incoming payload:", req.body);

    if (!customer_id || !business_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `
Create a website structure in JSON.
Business: ${business_name}
Description: ${business_description}
Industry: ${industry}
Location: ${location}

Return JSON ONLY:
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
      console.error("SUPABASE INSERT ERROR:", error);
      return res.status(500).json({ error });
    }

    res.json({
      success: true,
      inserted: data,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// IMPORTANT: LISTEN
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
