// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getCollections } = require('../mongoConnection')


router.post("/user",  async (req, res) => {
  const { userCollection } = await getCollections();
  const { email } = req.body;

  try {
      const existingUser = await userCollection.findOne({ email });

      if (!existingUser) {
          const newUser = {
              email,
              plan: "free",
              expiryDate: null,
          };

          const result = await userCollection.insertOne(newUser);
          if (result.insertedId) {
              res.status(201).json(newUser); 
          } else {
              res.status(500).json({ message: "Could not save the user. Please try again." });
          }
      } else {
          res.json(existingUser);
      }
  } catch (error) {
      console.error("Database error:", error);
      res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
