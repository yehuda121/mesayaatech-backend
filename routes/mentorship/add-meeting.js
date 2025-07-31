// routes/progress/add-meeting.js
const express = require('express');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.post('/', verifyToken, async (req, res) => {
  const { mentorId, reservistId, meeting } = req.body;
  if (!mentorId || !reservistId || !meeting) return res.status(400).json({ error: 'Missing data' });

  try {
    const command = new UpdateItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: `reservist#${reservistId}` }
      },
      UpdateExpression: 'SET meetings = list_append(if_not_exists(meetings, :empty), :m)',
      ExpressionAttributeValues: marshall({
        ':m': [meeting],
        ':empty': []
      }),
      ReturnValues: 'UPDATED_NEW'
    });

    await ddb.send(command);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Add Meeting Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
