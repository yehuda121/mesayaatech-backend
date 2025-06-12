// const express = require('express');
// const router = express.Router();
// const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
// const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
// require('dotenv').config();

// const ddb = new DynamoDBClient({
//   region: 'eu-north-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// router.post('/', async (req, res) => {
//   try {
//     const { eventId, fullName, idNumber, email } = req.body;

//     if (!eventId || !fullName || !idNumber || !email) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     const key = {
//       PK: { S: `event#${eventId}` },
//       SK: { S: 'metadata' }
//     };

//     // 1. Get current event
//     const getCommand = new GetItemCommand({
//       TableName: 'Events',
//       Key: key
//     });

//     const result = await ddb.send(getCommand);
//     if (!result.Item) return res.status(404).json({ error: 'Event not found' });

//     const eventData = unmarshall(result.Item);
//     const participants = eventData.participants || [];

//     // 2. Check if already registered
//     const alreadyJoined = participants.some(p => p.idNumber === idNumber);
//     if (alreadyJoined) {
//       return res.status(400).json({ error: 'User already registered for event' });
//     }

//     // 3. Append new participant
//     const newParticipant = { fullName, idNumber, email };
//     const updateCommand = new UpdateItemCommand({
//       TableName: 'Events',
//       Key: key,
//       UpdateExpression: 'SET participants = list_append(if_not_exists(participants, :empty), :newP)',
//       ExpressionAttributeValues: marshall({
//         ':newP': [newParticipant],
//         ':empty': []
//       }),
//       ReturnValues: 'UPDATED_NEW'
//     });

//     await ddb.send(updateCommand);

//     res.status(200).json({ message: 'Joined event successfully' });
//   } catch (err) {
//     console.error('Error joining event:', err);
//     res.status(500).json({ error: 'Internal server error', details: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  try {
    const { eventId, fullName, idNumber, email } = req.body;

    if (!eventId || !fullName || !idNumber || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const key = {
      PK: { S: `event#${eventId}` },
      SK: { S: 'metadata' }
    };

    const getCommand = new GetItemCommand({
      TableName: 'Events',
      Key: key
    });

    const result = await ddb.send(getCommand);
    if (!result.Item) return res.status(404).json({ error: 'Event not found' });

    const eventData = unmarshall(result.Item);
    const participants = eventData.participants || [];

    const participantIndex = participants.findIndex(p => p.idNumber === idNumber);
    let newParticipants = [];

    if (participantIndex >= 0) {
      // User already joined → remove him
      newParticipants = participants.filter(p => p.idNumber !== idNumber);
    } else {
      // User not joined → add him
      newParticipants = [...participants, { fullName, idNumber, email }];
    }

    const updateCommand = new UpdateItemCommand({
      TableName: 'Events',
      Key: key,
      UpdateExpression: 'SET participants = :newList',
      ExpressionAttributeValues: marshall({
        ':newList': newParticipants
      }),
      ReturnValues: 'UPDATED_NEW'
    });

    await ddb.send(updateCommand);

    res.status(200).json({
      message: participantIndex >= 0 ? 'Removed from event' : 'Joined event',
      joined: participantIndex < 0
    });
  } catch (err) {
    console.error('Error toggling event participation:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = router;
