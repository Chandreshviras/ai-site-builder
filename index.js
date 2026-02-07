import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

/* middleware */
app.use(cors());
app.use(express.json());

/* ROOT TEST */
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

/* HEALTH CHECK */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* GENERATE SITE (TEMP RESPONSE) */
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

    return res.json({
      success: true,
      message: "Generate site API working",
      data: {
        business_name,
        industry,
        location,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* START SERVER */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
