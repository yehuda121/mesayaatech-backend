const express = require('express');
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

router.post('/', async (req, res) => {
  try {
    const { questionId, text, answeredBy, answeredName, createdAt } = req.body;

    if (!questionId || !text || !answeredBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Fetch original question to get the category
    const getCommand = new GetItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({
        PK: `question#${questionId}`,
        SK: 'metadata',
      }),
    });

    const questionData = await ddb.send(getCommand);

    if (!questionData.Item) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = unmarshall(questionData.Item);
    const category = question.category || 'other';

    const answerId = uuidv4();

    const item = marshall({
      PK: `question#${questionId}`,
      SK: `answer#${answerId}`,
      answerId,
      questionId, 
      text,
      answeredBy,
      answeredName,
      category,
      createdAt: createdAt || new Date().toISOString(),
    });

    const command = new PutItemCommand({
      TableName: 'InterviewQuestions',
      Item: item,
    });

    await ddb.send(command);

    return res.status(200).json({ message: 'Answer uploaded', answerId });
  } catch (err) {
    console.error("❌ Error uploading answer:", err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
