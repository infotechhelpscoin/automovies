const express = require('express');
const router = express.Router();
const { getCollections } = require('../mongoConnection');
const {  ObjectId } = require('mongodb');

router.post("/affiliate-create", async (req, res) => {
  const { userId, referralCode } = req.body;
console.log('userid', userId)
  
  try {
    const { userCollection } = await getCollections();
    
    // Find the user by _id
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    // If user not found, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     // Check if the user already has a referral link
     if (user.referralLink) {
      return res.status(400).json({ message: "Referral link already exists" });
    }
    
    // Update the user document with the referral link
    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { referralLink: referralCode } }
    );

    console.log('Referral link added successfully for user:', userId);
    res.status(200).json({ message: "Referral link added successfully" });
  } catch (error) {
    console.error('Error adding referral link:', error);
    res.status(500).json({ message: "Error adding referral link" });
  }
});


router.put("/update-payment-email", async (req, res) => {
  const { userId, email } = req.body;
  console.log('userid', userId);
  
  try {
    const { userCollection } = await getCollections();
    
    // Find the user by _id
    const user = await userCollection.findOne({ _id: new ObjectId(userId) });
    
    // If user not found, return an error
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user document with the new PayPal email
    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { paypalEmail: email } }
    );

    console.log('PayPal email updated successfully for user:', userId);
    res.status(200).json({ message: "PayPal email updated successfully" });
  } catch (error) {
    console.error('Error updating PayPal email:', error);
    res.status(500).json({ message: "Error updating PayPal email" });
  }
});


module.exports = router;
