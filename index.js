import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    supabase: !!process.env.SUPABASE_URL,
    openai: !!process.env.OPENAI_API_KEY
  });
});
