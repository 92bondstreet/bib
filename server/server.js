const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/restaurants", (req, res) => {
  res.sendFile(path.join(__dirname, "allRestaurants.json"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
