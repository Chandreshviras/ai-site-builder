import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

console.log("Registering routes...");

app.get("/", (req, res) => {
  res.send("AI Backend is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// fallback to see unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
