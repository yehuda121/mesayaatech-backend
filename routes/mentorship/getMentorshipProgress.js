// routes/progress/get-progress.js
const express = require('express');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const router = express.Router();
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

router.get('/', verifyToken, async (req, res) => {
  const { mentorId, reservistId } = req.query;
  if (!mentorId || !reservistId) return res.status(400).json({ error: 'Missing IDs' });

  try {
    const command = new GetItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: `reservist#${reservistId}` }
      }
    });

    const { Item } = await ddb.send(command);
    if (!Item) return res.status(404).json({ error: 'Not found' });
    res.json(unmarshall(Item));
  } catch (err) {
    console.error('DynamoDB Get Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;