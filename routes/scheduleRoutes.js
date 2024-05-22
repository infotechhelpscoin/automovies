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
  const totalTasks = postADay * 2;
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

