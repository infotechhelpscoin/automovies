const express = require('express');
const { getCollections } = require('../mongoConnection');
const {  ObjectId } = require('mongodb');

const router = express.Router();
router.use(express.json());

const TASK_INTERVAL_HOURS = { '1': 24, 'default': 12 };

router.post("/scheduled_video", async (req, res) => {
  const { email, seriesId, postADay, googleId } = req.body;

  if (!email || !seriesId || !postADay || !googleId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const { scheduleCollection, userCollection, seriesCollection } = await getCollections();

  try {
    const series = await seriesCollection.findOne({ _id: new ObjectId(seriesId) }, { projection: { content: 1 } });
    const user = await userCollection.findOne({ googleId }, { projection: { refreshToken: 1 } });
    if (!series || !user) {
      return res.status(404).json({ message: !series ? "Series not found" : "User not found" });
    }

    const tasks = createTasks(postADay, series.content, user.refreshToken, seriesId, email);
    await scheduleCollection.insertMany(tasks);

    res.status(200).json({
      message: `Scheduled ${tasks.length} tasks successfully`,
      scheduledTasks: tasks.length
    });

  } catch (error) {
    console.error('Error processing the scheduled video:', error);
    res.status(500).json({ message: "Failed to retrieve data or schedule tasks" });
  }
});

function createTasks(postADay, content, refreshToken, seriesId, email) {
  const totalTasks = postADay * 5;
  const intervalHours = TASK_INTERVAL_HOURS[postADay] || TASK_INTERVAL_HOURS['default'];
  const currentTime = new Date();
  const tasks = [];

  for (let i = 0; i < totalTasks; i++) {
    const scheduleTime = new Date(currentTime.getTime() + i * intervalHours * 60 * 60000);
    tasks.push({
      seriesId,
      seriesName: content,
      refreshToken,
      status: "pending",
      scheduleTime,
      lastRunTime: null,
      result: null,
    });
  }

  return tasks;
}

module.exports = router;



// router.post("/scheduled_video", async (req, res) => {
//   const { email, seriesId, postADay, googleId } = req.body;

//   console.log(email, seriesId, googleId)

//   const {
//     scheduleCollection, userCollection, seriesCollection
//   } = await getCollections();

//   if (!email || !seriesId || !postADay || !googleId) {
//     return res.status(400).send("Missing required fields.");
//   }
//   let content;
//   let refreshToken;
//   try {
//     const series = await seriesCollection.findOne({ _id: new ObjectId(seriesId) }, { projection: { content: 1 } });
//     if (!series) {
//       return res.status(404).json({ message: "Series not found" });
//     }
//     console.log('series', series)
//     content = series.content;

//     // Fetch only the 'refreshToken' field from the user document using projection
//     const user = await userCollection.findOne({ googleId: googleId }, { projection: { refreshToken: 1 } });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     refreshToken = user.refreshToken;
//     console.log('series', refreshToken)
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     res.status(500).json({ message: "Failed to retrieve data" });
//   }

//   try {
//     const totalTasks = postADay * 5;
//     const intervalHours = postADay === 1 ? 24 : 12;
//     const currentTime = new Date();

//     console.log(`Scheduling ${totalTasks} for series id ${seriesId} and email ${email}`); 

//     const tasks = [];
//     for (let i = 0; i < totalTasks; i++) {
//       const scheduleTime = new Date(currentTime.getTime() + i * intervalHours * 60 * 60000);
//       tasks.push({
//         seriesId: seriesId,
//         seriesName: content,
//         refreshToken,
//         status: "pending",
//         scheduleTime,
//         lastRunTime: null,
//         result: null,
//       });
//     }
//     await scheduleCollection.insertMany(tasks);

//     res.status(200).send(`Scheduled ${totalTasks} tasks successfully.`);
//   } catch (error) {
//     console.error("Failed to schedule task:", error);
//     res.status(500).send("Failed to schedule task.");
//   } 
// });


// module.exports = router;