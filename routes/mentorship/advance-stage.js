// routes/progress/advance-stage.js
const express = require('express');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const router = express.Router();

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.post('/', async (req, res) => {
  const { mentorId, reservistId } = req.body;
  if (!mentorId || !reservistId) return res.status(400).json({ error: 'Missing IDs' });

  try {
    const command = new UpdateItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: `reservist#${reservistId}` }
      },
      UpdateExpression: 'SET progressStage = if_not_exists(progressStage, :zero) + :inc',
      ExpressionAttributeValues: {
        ':zero': { N: '1' },
        ':inc': { N: '1' }
      },
      ReturnValues: 'UPDATED_NEW'
    });

    await ddb.send(command);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Advance Stage Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
