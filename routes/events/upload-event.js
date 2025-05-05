const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

require('dotenv').config();

// Initialize DynamoDB client
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Function to sanitize the event title for use in keys
const sanitizeTitleForKey = (title) => {
  return title
    .trim()
    .replace(/\s+/g, '-')               // spaces -> hyphens
    .replace(/[^a-zA-Z0-9א-ת-_]/g, ''); // remove invalid characters
};

// Route to upload a new event to DynamoDB
router.post('/', async (req, res) => {
  console.log('Received request to create event');

  try {
    const event = req.body;

    // Validate required fields
    if (!event.title || !event.date) {
      return res.status(400).json({ error: 'Missing required fields: title or date' });
    }

    const cleanTitle = sanitizeTitleForKey(event.title);
    const eventKey = `${event.date}-${cleanTitle}`;

    const item = {
      PK: `event#${eventKey}`,           // Partition Key
      SK: 'metadata',                    // Sort Key
      title: event.title.trim(),
      date: event.date,
      location: event.location || '',
      description: event.description || '',
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: 'Events',
      Item: marshall(item),
    });

    await ddb.send(command);

    console.log('Event saved to DynamoDB successfully');
    res.status(200).json({ message: 'Event saved successfully' });
  } catch (err) {
    console.error('Error saving event to DynamoDB:', err);
    res.status(500).json({ error: 'Failed to save event', details: err.message });
  }
});

module.exports = router;
