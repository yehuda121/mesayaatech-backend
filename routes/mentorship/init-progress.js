// routes/mentorship/init-progress.js
const express = require('express');
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const router = express.Router();
const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.post('/', async (req, res) => {
  const { mentorId, reservistId } = req.body;

//   console.log('INIT PROGRESS:', mentorId, reservistId); 

  if (!mentorId || !reservistId){
    console.error('Missing IDs'); 
    return res.status(400).json({ error: 'Missing IDs' });
  }

  const PK = `mentor#${mentorId}`;
  const SK = `reservist#${reservistId}`;

  try {
    // Check if already exists
    const getCommand = new GetItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: PK },
        SK: { S: SK }
      }
    });

    const { Item } = await ddb.send(getCommand);
    if (Item) return res.status(200).json({ message: 'Already exists' });

    // Create initial record
    const putCommand = new PutItemCommand({
      TableName: 'mentorshipProgress',
      Item: marshall({
        PK,
        SK,
        progressStage: 1,
        meetings: []
      })
    });

    await ddb.send(putCommand);
    res.status(201).json({ message: 'Progress initialized' });
  } catch (err) {
    console.error('Init Progress Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;