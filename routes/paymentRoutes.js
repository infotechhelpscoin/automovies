const express = require('express');
const { ObjectId } = require('mongodb');
const { getCollections } = require('../mongoConnection');
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
require("dotenv").config();
// app.use(express.urlencoded({ extended: false }));

// router.post("/payment", async (req, res) => {
//   const { userId, price } = req.body;
//   console.log('Received payment info:', { userId, price });

//   try {
//     const { userCollection } = await getCollections();

//     // Find the user by _id
//     const user = await userCollection.findOne({ _id: new ObjectId(userId) });

//     // If user not found, return an error
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Log the user details
//     console.log('User found:', user);

//     // Here, you would handle the payment processing logic
//     // For now, we just return a success message

//     res.status(200).json({ message: "Payment processed successfully" });
//   } catch (error) {
//     console.error('Error processing payment:', error);
//     res.status(500).json({ message: "Error processing payment" });
//   }
// });


router.post("/order", async (req, res) => {
  try {
    const razorpay = new Razorpay({
      key_id:process.env.RAZORPAY_ID,
      key_secret:process.env.RAZORPAY_SECRET
    })
    // console.log('razor pay', razorpay)
    
    const { userId, amount, currency, receipt} = req.body;

    const options = {
      amount, currency, receipt
    }
    
    console.log('options', options)
    const order = await razorpay.orders.create(options)
    console.log('order', order)

    if(!order){
      return res.status(500).send("Error")
    }
    res.json(order)

  } catch (error) {
    console.log(error)
    res.status(500).send('Error')
  }
})

router.post("/order/validate", async (req, res) => {
  const {razorpay_order_id, razorpay_payment_id, razorpay_signature, userId} = req.body;
console.log('req.body', razorpay_order_id, razorpay_payment_id, razorpay_signature)
  const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET)

  console.log('sha', sha)
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`)
  const digest = sha.digest("hex")
  console.log('digest', digest)

  if(digest !== razorpay_signature){
    return res.status(400).json({msg: "Transaction is not legit!"})
  }

   // Find the user by _id
   const user = await userCollection.findOne({ _id: new ObjectId(userId) });
   if (!user) {
     return res.status(404).json({ msg: "User not found!" });
   }

   // Update the user's document with the order and payment ID
   await userCollection.updateOne(
     { _id: new ObjectId(userId) },
     { $set: { orderId: razorpay_order_id, paymentId: razorpay_payment_id } }
   );

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  })



})


module.exports = router;
