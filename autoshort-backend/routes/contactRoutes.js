const express = require('express');
const router = express.Router();
const { getCollections } = require('../mongoConnection');



router.post("/contact", async (req, res) => {
  const { name, phone, email, query } = req.body;
  const { contactCollection } = await getCollections();

  try {
      const result = await contactCollection.insertOne({
          name,
          phone,
          email,
          query
      });
      console.log("Contact form data saved successfully:", result);
      res.status(201).json({ message: "Contact form data saved successfully" });
  } catch (error) {
      console.error("Error saving contact form data:", error);
      res.status(500).json({ message: "Error saving contact form data" });
  }
});


module.exports = router;