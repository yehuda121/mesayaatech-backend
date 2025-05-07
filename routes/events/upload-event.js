// module.exports = router;
const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid'); // נוסיף את זה בראש הקובץ

require('dotenv').config();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  try {
    const event = req.body;

    if (!event.description || !event.date) {
      return res.status(400).json({ error: 'Missing required fields: description or date' });
    }

    const eventId = event.eventId || uuidv4(); // מקבל מלקוח או יוצר חדש
    const item = {
      PK: `event#${eventId}`,
      SK: 'metadata',
      eventId, // שומר גם לשימוש בלקוח
      title: event.title?.trim() || '',
      date: event.date,
      location: event.location || '',
      description: event.description || '',
      notes: event.notes || '',
      time: event.time || '',
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: 'Events',
      Item: marshall(item),
    });

    await ddb.send(command);

    console.log('Event saved to DynamoDB successfully');
    res.status(200).json({ message: 'Event saved successfully', eventId });
  } catch (err) {
    console.error('Error saving event to DynamoDB:', err);
    res.status(500).json({ error: 'Failed to save event', details: err.message });
  }
});

module.exports = router;
