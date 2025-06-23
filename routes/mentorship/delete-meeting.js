// routes/progress/delete-meeting.js
const express = require('express');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const router = express.Router();

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.post('/', async (req, res) => {
  const { mentorId, reservistId, meetingIndex } = req.body;
  if (!mentorId || !reservistId || meetingIndex === undefined) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const removeExpr = `REMOVE meetings[${meetingIndex}]`;

    const command = new UpdateItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: `reservist#${reservistId}` }
      },
      UpdateExpression: removeExpr,
      ReturnValues: 'UPDATED_NEW'
    });

    await ddb.send(command);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete Meeting Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
