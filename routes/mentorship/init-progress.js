// routes/mentorship/init-progress.js
const express = require('express');
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const verifyToken = require('../../utils/verifyToken');
const router = express.Router();
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

router.post('/',verifyToken, async (req, res) => {
  const { mentorId, reservistId } = req.body;

  if (!mentorId || !reservistId) {
    console.error('Missing mentorId or reservistId in request body.');
    return res.status(400).json({ error: 'Missing IDs' });
  }

  const PK = `mentor#${mentorId}`;
  const SK = `reservist#${reservistId}`;

  try {
    // Check if mentorship progress already exists
    const getCommand = new GetItemCommand({
      TableName: 'mentorshipProgress',
      Key: {
        PK: { S: PK },
        SK: { S: SK }
      }
    });

    const { Item } = await ddb.send(getCommand);
    if (Item) {
      console.log('Mentorship progress already exists for:', PK, SK);
      return res.status(200).json({ message: 'Already exists' });
    } 

    // Fetch mentor full name
    // console.log('Fetching mentor full name for mentorId:', mentorId);
    const mentorRes = await ddb.send(new GetItemCommand({
      TableName: 'mentorUserForms',
      Key: { 
        PK: { S: `mentor#${mentorId}` },
        SK: { S: 'registrationForm' }
      }
    }));

    const mentorName = mentorRes.Item ? (unmarshall(mentorRes.Item).fullName || '') : '';
    // console.log("mentorName: ", mentorName);

    // Fetch reservist full name
    // console.log('Fetching reservist full name for reservistId:', reservistId);
    const reservistRes = await ddb.send(new GetItemCommand({
      TableName: 'reservUserForms',
      Key: { 
        PK: { S: `reservist#${reservistId}` },
        SK: { S: 'registrationForm' }
      }
    }));

    const reservistName = reservistRes.Item ? (unmarshall(reservistRes.Item).fullName || '') : '';
    // console.log("reservistName: ", reservistName);

    // Insert new mentorship progress record with names
    const putCommand = new PutItemCommand({
      TableName: 'mentorshipProgress',
      Item: marshall({
        PK,
        SK,
        progressStage: 1,
        meetings: [],
        mentorName,
        reservistName
      })
    });

    await ddb.send(putCommand);
    // console.log('Mentorship progress initialized successfully for:', PK, SK);
    res.status(201).json({ message: 'Progress initialized with names' });

  } catch (err) {
    console.error('Init Progress Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
