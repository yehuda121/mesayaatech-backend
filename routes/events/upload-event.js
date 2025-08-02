const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid'); 
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const event = req.body;

    if (!event.description || !event.date) {
      return res.status(400).json({ error: 'Missing required fields: description or date' });
    }

    const eventId = event.eventId || uuidv4(); 
    const item = {
      PK: `event#${eventId}`,
      SK: 'metadata',
      eventId,
      title: event.title?.trim() || '',
      date: event.date,
      location: event.location || '',
      description: event.description || '',
      notes: event.notes || '',
      time: event.time || '',
      createdAt: new Date().toISOString(),
      participants: [],
    };

    const command = new PutItemCommand({
      TableName: 'Events',
      Item: marshall(item),
    });

    await ddb.send(command);

    // console.log('Event saved to DynamoDB successfully');
    res.status(200).json({ message: 'Event saved successfully', eventId });
  } catch (err) {
    console.error('Error saving event to DynamoDB:', err);
    res.status(500).json({ error: 'Failed to save event', details: err.message });
  }
});

module.exports = router;
