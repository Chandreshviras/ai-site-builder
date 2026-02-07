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

// IMPORTANT: LISTEN
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
