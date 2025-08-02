const express = require('express');
const router = express.Router();
const {
  DynamoDBClient,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const verifyToken = require('../../utils/verifyToken');
require('dotenv').config();
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ error: 'Missing eventId' });

    const command = new DeleteItemCommand({
      TableName: 'Events',
      Key: marshall({ PK: `event#${eventId}`, SK: 'metadata' })
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete failed:', err);
    res.status(500).json({ error: 'Failed to delete event', details: err.message });
  }
});

module.exports = router;
