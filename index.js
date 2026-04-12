import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.json({ message: "good" });
});

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
