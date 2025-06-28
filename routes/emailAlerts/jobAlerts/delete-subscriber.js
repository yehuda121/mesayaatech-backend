// delete-subscriber.js
require('dotenv').config();

const express = require("express");
const router = express.Router();
const { DynamoDBClient, DeleteItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");

// Initialize DynamoDB client for the relevant region
const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});
/**
 * Deletes a subscriber from the "jobAlertsSubscribers" table by ID number.
 *
 * @param {string} idNumber - The national ID of the subscriber to delete
 */
async function deleteSubscriber(idNumber) {
  if (!idNumber) {
    throw new Error("idNumber is required to delete a subscriber.");
  }

  // Build the partition key (PK)
  const pk = `jobAlert#${idNumber}`;

  // Prepare the delete command
  const deleteParams = {
    TableName: "jobAlertsSubscribers",
    Key: marshall({ PK: pk }),
  };

  try {
    await dynamo.send(new DeleteItemCommand(deleteParams));
    console.log("Subscriber deleted:", idNumber);
  } catch (err) {
    console.error("Error deleting subscriber:", err);
    throw err;
  }
}

// Handle POST /api/jobAlerts/delete-subscriber
router.post("/", async (req, res) => {
  const { idNumber } = req.body;
  try {
    await deleteSubscriber(idNumber);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
