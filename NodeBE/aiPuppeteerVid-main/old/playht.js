const fetch = require('node-fetch');

async function TTS(text,filepath)
{
const url = 'https://play.ht/api/v2/tts/stream';
const options = {
  method: 'POST',
  headers: {
    accept: 'audio/mpeg',
    'content-type': 'application/json',
    AUTHORIZATION: 'Bearer YOUR_SECRET_KEY_HERE',
    'X-USER-ID': 'YOUR_USER_ID_HERE'
  },
  body: JSON.stringify({
    text: text,
    voice: 'larry',
    quality: 'draft',
    output: filepath,
    output_format: 'mp3'
  })
};

let res= await fetch(url, options);
  return res.json;
}
  module.exports={TTS:TTS}