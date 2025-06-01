const express = require('express');
const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const router = express.Router();

const db = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  const { mentorId, reservistId } = req.body;

  if (!mentorId || !reservistId) {
    return res.status(400).json({ error: 'Missing mentorId or reservistId' });
  }

  const pk = `reservist#${reservistId}`;
  const sk = 'registrationForm';

  try {
    const getCommand = new GetItemCommand({
      TableName: 'reservUserForms',
      Key: {
        PK: { S: pk },
        SK: { S: sk },
      },
    });

    const result = await db.send(getCommand);

    if (!result.Item) {
      return res.status(404).json({ error: 'Reservist not found' });
    }

    const existing = result.Item;

    if (existing.mentorId && existing.mentorId.S) {
      return res.status(400).json({ error: 'Reservist already assigned to a mentor' });
    }

    const updateCommand = new UpdateItemCommand({
      TableName: 'reservUserForms',
      Key: {
        PK: { S: pk },
        SK: { S: sk },
      },
      UpdateExpression: 'SET mentorId = :mentorId',
      ExpressionAttributeValues: {
        ':mentorId': { S: `mentor#${mentorId}` },
      },
    });

    await db.send(updateCommand);

    res.status(200).json({ message: 'Reservist successfully assigned to mentor' });
  } catch (err) {
    console.error('Error assigning mentor:', err);
    res.status(500).json({ error: 'Failed to assign mentor' });
  }
});

module.exports = router;
