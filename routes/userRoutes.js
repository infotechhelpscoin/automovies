// routes/userRoutes.js
const express = require('express');
const router = express.Router();

// Example route for getting a user
router.get('/', async (req, res) => {
  res.send('User data');
});

// Example route for creating a user
router.post('/', async (req, res) => {
  res.send('User created');
});

module.exports = router;
