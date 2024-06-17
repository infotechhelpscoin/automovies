const fs = require("fs");
const axios = require("axios");

const API_KEY = "sk-proj-RlgfaakTAOkGHEgXNrdhT3BlbkFJE2sPL59MmdLZqmnqRlbq";


async function getImageInfo(image) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };

  let responses = [];

  const payload = {
    model: "gpt-4o",
    max_tokens: 4000,
    messages: [],
  };

  
    const imageData = fs.readFileSync(image.path);
    const base64Image = Buffer.from(imageData).toString("base64");

    payload.messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: `${image.prompt}`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
      ],
    });

    if (image.path2) {
      const imageData2 = fs.readFileSync(image.path2);
      const base64Image2 = Buffer.from(imageData2).toString("base64");

      payload.messages[payload.messages.length - 1].content.push({
        type: "image_url",
        image_url: {
          url: `data:image/jpeg;base64,${base64Image2}`,
        },
      });
    }
  

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      payload,
      { headers }
    );

    const responseData = response.data.choices;
    console.log(responseData[0].message.content);

    return responseData;
    // responseData.forEach((choice, index) => {
    //   const answer =
    //     choice.message.content[0].text === "{"
    //       ? JSON.parse(choice.message.content[0].text).answer
    //       : choice.message.content[0].text;
    //   const formattedAnswer = answer.replace(/({|}|answer:)/g, "").trim();

    //   responses[images[index].name] = formattedAnswer;
    //   console.log(images[index].name, "Response:", formattedAnswer);
    // });
  } catch (error) {
    console.error("Error during API call:", error.message);
  }

  return responses;
}
async function saveImageInfo(image) {
  try {
    const res = await getImageInfo(image);
    const text = res[0].message.content;
    fs.writeFileSync(image.saveFilePath, text);
    return text;
  } catch (error) {
    console.error("Error saving image info:", error.message);
    return null;
  }
}

module.exports = { getImageInfo: getImageInfo,saveImageInfo:saveImageInfo };
