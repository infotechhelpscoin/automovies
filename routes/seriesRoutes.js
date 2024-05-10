const express = require('express');
const router = express.Router();
const { getCollections } = require('../mongoConnection');

// Middleware to validate series data
function validateSeriesData(req, res, next) {
    const { destination, content, narrator, language, duration, userEmail } = req.body;
    if (!destination || !content || !narrator || !language || !duration || !userEmail) {
        return res.status(400).json({ message: "All fields must be filled" });
    }
    next();
}

// Middleware to validate email in the query
function validateEmailQuery(req, res, next) {
  const { email } = req.query;
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Invalid or missing email address" });
  }
  next();
}

router.post("/series", validateSeriesData, async (req, res) => {
    const { destination, content, narrator, language, duration, userEmail } = req.body;
    const { seriesCollection } = await getCollections();

    try {
        const result = await seriesCollection.insertOne({
            destination,
            content,
            narrator,
            language,
            duration,
            userEmail,
        });
        console.log("Data saved successfully:", result);
        res.status(201).json({ message: "Data saved successfully" });
    } catch (error) {
        console.error("Error saving data:", error);
        res.status(500).json({ message: "Error saving data" });
    }
});

// Get series data based on user email
router.get("/series_info", validateEmailQuery, async (req, res) => {
  const email = req.query.email;
  const { seriesCollection } = await getCollections();
  try {
      const seriesData = await seriesCollection.find({ userEmail: email }).toArray();
      res.json(seriesData);
  } catch (error) {
      console.error("Error fetching series data:", error);
      res.status(500).json({ message: "Error fetching series data" });
  }
});


module.exports = router;
