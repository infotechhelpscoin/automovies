const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { oAuth2Client } = require('../config/googleOAuth')
const { getCollections } = require('../mongoConnection')
require('dotenv').config();

router.get("/connect_youtube", (req, res) => {
  const state = crypto.randomBytes(20).toString('hex');
  const nonce = crypto.randomBytes(20).toString('hex');

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "openid",
      "email",
    ],
    include_granted_scopes: true,
    state: state,
    nonce: nonce,
    response_type: 'code',
    prompt: 'consent',
  });

  console.log("redirect url", authUrl);
  res.redirect(authUrl);
});

// OAuth2 callback route
router.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const { userCollection } = await getCollections();
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    const decoded = jwt.decode(tokens.id_token);
    const user = await userCollection.findOne({ email: decoded.email });

    if (user) {
      await userCollection.updateOne(
        { email: decoded.email },
        {
          $set: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            googleId: decoded.sub,
          },
        }
      );
    } else {
      const newUser = {
        googleId: decoded.sub,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        email: decoded.email,
      };
      await userCollection.insertOne(newUser);
    }

    const redirectUri = `${process.env.FRONTEND_REDIRECT_URI}?googleId=${decoded.sub}`;
    res.redirect(redirectUri);
  } catch (error) {
    console.error("Error retrieving access token", error);
    res.status(500).send("Authentication failed");
  }
});

module.exports = router;