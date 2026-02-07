import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ROUTES FIRST
app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// LISTEN LAST
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
