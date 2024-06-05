const express = require('express');
const router = express.Router();
const { getCollections } = require('../mongoConnection');
const { ObjectId } = require('mongodb');


// PATCH route to update Google ID using taskId as a query parameter
router.patch("/googleId", async (req, res) => {
   
    const taskId = req.query.taskId;
    const { googleId } = req.body;
    const { seriesCollection } = await getCollections();

    try {
        const result = await seriesCollection.updateOne(
            { _id: new ObjectId(taskId) },
            { $set: { googleId: googleId } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "No task found with that ID",
                status: "fail",
            });
        }

        res.json({
            message: `Task ${taskId} has been updated with new Google ID: ${googleId}`,
            status: "success",
        });
    } catch (error) {
        console.error(`Error updating task ${taskId}:`, error);
        res.status(500).json({
            message: `Error updating task with ID ${taskId}`,
            status: "error",
        });
    }
});

module.exports = router;
