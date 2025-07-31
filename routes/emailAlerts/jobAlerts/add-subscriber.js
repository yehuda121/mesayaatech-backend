require('dotenv').config();

const express = require("express");
const router = express.Router();
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { marshall } = require("@aws-sdk/util-dynamodb");
const verifyToken = require('../../../utils/verifyToken');
// Initialize the DynamoDB client for the us-east-1 region
const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Adds or updates a subscriber in the "jobAlertsSubscribers" DynamoDB table.
 * - If the subscriber does not exist: create a new record.
 * - If the subscriber exists: overwrite with new fields (only if there are fieldsOfInterest).
 *
 * @param {Object} subscriber - The subscriber object
 * @param {string} subscriber.idNumber - The national ID of the user (used to generate the PK)
 * @param {string} subscriber.fullName - Full name of the user
 * @param {string} subscriber.email - Email address of the user
 * @param {string[]} subscriber.fieldsOfInterest - List of job fields the user is interested in
 */
async function addSubscriber(subscriber) {
  const { idNumber, fullName, email, fieldsOfInterest } = subscriber;

  // Validate input fields
  if (!idNumber || !email || !Array.isArray(fieldsOfInterest)) {
    throw new Error("Missing or invalid fields: idNumber, email, or fieldsOfInterest.");
  }

  // Build the partition key (PK)
  const pk = `jobAlert#${idNumber}`;

  // Check if the subscriber already exists in the table
  const getParams = {
    TableName: "jobAlertsSubscribers",
    Key: marshall({ PK: pk }),
  };

  const existing = await dynamo.send(new GetItemCommand(getParams));

  // If subscriber exists, update it only if new fields are provided
  if (existing.Item) {
    if (fieldsOfInterest.length === 0) {
      throw new Error("Cannot update subscriber without at least one field of interest.");
    }

    const putParams = {
      TableName: "jobAlertsSubscribers",
      Item: marshall({
        PK: pk,
        fullName,
        email,
        fieldsOfInterest,
        updatedAt: new Date().toISOString(),
      }),
    };

    await dynamo.send(new PutItemCommand(putParams));
    console.log("Subscriber updated:", email);
    return;
  }

  // If subscriber does not exist, create a new record
  const putParams = {
    TableName: "jobAlertsSubscribers",
    Item: marshall({
      PK: pk,
      fullName,
      email,
      fieldsOfInterest,
      createdAt: new Date().toISOString(),
    }),
  };

  await dynamo.send(new PutItemCommand(putParams));
  // console.log("Subscriber created:", email);
}

// Handle POST /api/jobAlerts/add-subscriber
router.post("/", verifyToken, async (req, res) => {
  try {
    await addSubscriber(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("Error adding subscriber:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
