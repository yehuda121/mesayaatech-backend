// toggle-question-read.js
const express = require('express');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const router = express.Router();
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { questionId, idNumber, fullName } = req.body;

  if (!questionId || !idNumber || !fullName) {
    return res.status(400).json({ error: 'Missing questionId, idNumber or fullName' });
  }

  try {
    const getCmd = new GetItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: 'metadata' }),
    });

    const result = await ddb.send(getCmd);
    if (!result.Item) return res.status(404).json({ error: 'Question not found' });

    const question = unmarshall(result.Item);
    const readBy = question.readBy || [];
    const alreadyRead = readBy.some(read => read.idNumber === idNumber);

    const updatedReadBy = alreadyRead
      ? readBy.filter(read => read.idNumber !== idNumber)
      : [...readBy, { idNumber, fullName, readAt: new Date().toISOString() }];

    const updateCmd = new UpdateItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: 'metadata' }),
      UpdateExpression: 'SET #readBy = :readBy',
      ExpressionAttributeNames: { '#readBy': 'readBy' },
      ExpressionAttributeValues: {
        ':readBy': { L: updatedReadBy.map(read => ({ M: marshall(read) })) }
      },
    });

    await ddb.send(updateCmd);
    return res.status(200).json({ message: 'Read status toggled' });
  } catch (err) {
    console.error('Error toggling read status:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
