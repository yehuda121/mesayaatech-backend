const express = require('express');
const router = express.Router();
const {
  DynamoDBClient,
  UpdateItemCommand
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { eventId, updatedData } = req.body;
    if (!eventId || !updatedData) return res.status(400).json({ error: 'Missing eventId or data' });

    const command = new UpdateItemCommand({
      TableName: 'Events',
      Key: {
        PK: { S: `event#${eventId}` },
        SK: { S: 'metadata' },
      },
      UpdateExpression: `
        SET 
          #title = :title, 
          #date = :date, 
          #location = :location, 
          #description = :description, 
          #notes = :notes, 
          #time = :time`,
      ExpressionAttributeNames: {
        '#title': 'title',
        '#date': 'date',
        '#location': 'location',
        '#description': 'description',
        '#notes': 'notes',
        '#time': 'time',
      },
      ExpressionAttributeValues: marshall({
        ':title': updatedData.title,
        ':date': updatedData.date,
        ':location': updatedData.location || '',
        ':description': updatedData.description || '',
        ':notes': updatedData.notes || '',
        ':time': updatedData.time || '',
      })
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Event updated successfully' });
  } catch (err) {
    console.error('Update failed:', err);
    res.status(500).json({ error: 'Failed to update event', details: err.message });
  }
});

module.exports = router;
