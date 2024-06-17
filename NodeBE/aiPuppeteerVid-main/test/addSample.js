// addSampleData.js

const { dbinsert } = require("../helpers/mongohelper");

async function addSampleData() {
  try {
    // Add sample data for RecordingVids collection
    const recordingVids = [
      {
        id: "sample1",
        status: "NotPicked",
        URLs: [
          "https://llama.meta.com/llama3/",
          "https://ai.meta.com/blog/meta-llama-3/",
          "https://ai.meta.com/resources/demos/",
        ],
      },
      {
        id: "sample2",
        status: "NotPicked",
        URLs: [
          "https://blog.google/technology/ai/google-gemini-next-generation-model-february-2024/#sundar-note",
          "https://blog.google/technology/ai/google-gemini-update-flash-ai-assistant-io-2024/",
        ],
      },
      // Add more sample data as needed
    ];

    for (const vid of recordingVids) {
      await dbinsert("RecordingVids", vid);
    }

    console.log("Sample data added successfully!");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

addSampleData();