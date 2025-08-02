// routes/progress/update-meeting.js
const express = require('express');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

router.post('/', verifyToken, async (req, res) => {
  const { mentorId, reservistId, meetingIndex, updatedMeeting } = req.body;
  if (!mentorId || !reservistId || meetingIndex === undefined || !updatedMeeting) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const command = new UpdateItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: `reservist#${reservistId}` }
      },
      UpdateExpression: `SET meetings[${meetingIndex}] = :m`,
      ExpressionAttributeValues: marshall({
        ':m': updatedMeeting
      }),
      ReturnValues: 'UPDATED_NEW'
    });

    await ddb.send(command);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Update Meeting Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
