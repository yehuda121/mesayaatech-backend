const express = require('express');
const { DynamoDBClient, DeleteItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const router = express.Router();
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });
const verifyToken = require('../../utils/verifyToken');

router.post('/', verifyToken, async (req, res) => {
  const { mentorId, reservistId } = req.body;

  if (!mentorId || !reservistId) {
    console.error('Missing IDs');
    // console.log('Missing IDs');
    return res.status(400).json({ error: 'Missing IDs' });
  }

  const PK = mentorId;
  const SK = `reservist#${reservistId}`;

  try {
    const deleteCommand = new DeleteItemCommand({
      TableName: 'mentorshipProgress',
      Key: { PK: { S: PK }, SK: { S: SK } }
    });

    await ddb.send(deleteCommand);

    const updateCommand = new UpdateItemCommand({
      TableName: 'reservUserForms',
      Key: { PK: { S: `reservist#${reservistId}` }, SK: { S: 'registrationForm' } },
      UpdateExpression: 'REMOVE mentorId',
    });

    await ddb.send(updateCommand);

    res.status(200).json({ message: 'Progress and mentorId cleared successfully' });
  } catch (err) {
    console.error('Delete Progress Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
