const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001; // We'll run our backend on this port

// This is our mock "database"
const citiesData = [
  { ID: 1, name: "New York", continent: "North America" },
  { ID: 2, name: "Tokyo", continent: "Asia" },
  { ID: 3, name: "London", continent: "Europe" },
  { ID: 4, name: "Cairo", continent: "Africa" },
  { ID: 5, name: "Sydney", continent: "Australia" },
  { ID: 6, name: "São Paulo", continent: "South America" },
];

app.use(cors()); // Enable CORS for all routes

// Define a simple API endpoint to get the cities
app.get("/api/cities", (req, res) => {
  console.log("Request received for /api/cities");
  // Simulate a network delay
  setTimeout(() => {
    res.json(citiesData);
  }, 1500); // 1.5 second delay
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
