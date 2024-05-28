const { getCollections } = require("../mongoConnection");
const { ObjectId } = require('mongodb');
const { sendEmail } = require("./mailer");

const fetchVideoGeneratedSchedules = async () => {
  try {
    const { scheduleCollection, seriesCollection } = await getCollections();

    const query = { 
      status: 'videoGenerated',
      $or: [
        { emailSent: { $exists: false } },
        { emailSent: false }
      ]
    };
    const projection = { seriesId: 1, videoLink: 1, seriesName: 1, scheduleTime:1, _id: 0 }; // Include seriesId, videoLink, and seriesName, exclude _id
    const schedules = await scheduleCollection.find(query).project(projection).toArray();

    console.log('Schedules:', schedules);

    // Extract and convert seriesId values into an array of ObjectIds
    const seriesIdArray = schedules.map(doc => new ObjectId(doc.seriesId));
    console.log('SeriesIdArray:', seriesIdArray);

    // Fetch documents from seriesCollection where _id is in the seriesIdArray
    const seriesQuery = { _id: { $in: seriesIdArray } };
    const seriesProjection = { userEmail: 1, _id: 1 }; // Include only userEmail and _id
    const seriesDocuments = await seriesCollection.find(seriesQuery).project(seriesProjection).toArray();

    console.log('Fetched Series Documents:', seriesDocuments);

    // Create a map for quick lookup of userEmail by seriesId
    const seriesMap = new Map();
    seriesDocuments.forEach(doc => {
      seriesMap.set(doc._id.toString(), doc.userEmail);
    });

    // Combine the schedules with the corresponding userEmails
    const result = schedules.map(schedule => ({
      ...schedule,
      userEmail: seriesMap.get(schedule.seriesId.toString())
    }));

    console.log('Combined Result:', result);
     // Send email for each item in the result array
     for (const item of result) {
      const to = `${item.userEmail}`;
      const subject = `Video link for ${item.seriesName}`;
      const text = `Your video for ${item.seriesName} is generated. The link is ${item.videoLink}. The video will be published on YouTube on ${item.scheduleTime}.`;

      try {
        await sendEmail(to, subject, text);
        console.log(`Email sent to ${to} for series ${item.seriesName}`);

        // Update the scheduleCollection to set emailSent to true
        await scheduleCollection.updateOne({ seriesId:item.seriesId }, { $set: { emailSent: true } });
        console.log(`Updated emailSent status for schedule ${item.seriesId}`);
      } catch (error) {
        console.error(`Error sending email or updating status for schedule ${item.seriesId}:`, error);
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching schedules and series:', error);
  } finally {
  
  }
};

// Usage example
// fetchVideoGeneratedSchedules();

module.exports = { fetchVideoGeneratedSchedules }
