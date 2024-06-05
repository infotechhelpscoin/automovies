const { google } = require('googleapis');
require('dotenv').config();

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

async function refreshAccessToken(refreshToken) {
  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;
    return accessToken;
  } catch (error) {
    // console.error("Failed to refresh access token:", error);
    throw new Error(`Failed to refresh access token. Error: ${error}`)
  }
}






module.exports = { oAuth2Client, refreshAccessToken };
