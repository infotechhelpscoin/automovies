// generateToken.js
const { google } = require('googleapis');
const readline = require('readline');
require('dotenv').config();

const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  "http://localhost/3000"
);

console.log('id, sec', process.env.GOOGLE_OAUTH_CLIENT_ID,
process.env.GOOGLE_OAUTH_CLIENT_SECRET,)
const scopes = [
  'https://www.googleapis.com/auth/gmail.send'
];

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting this url:', url);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Your refresh token is:', token.refresh_token);
  });
});
