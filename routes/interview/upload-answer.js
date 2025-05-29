const express = require('express');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
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

// POST /api/interview/answer
router.post('/', async (req, res) => {
  try {
    const { questionId, text, answeredBy, createdAt } = req.body;

    if (!questionId || !text || !answeredBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const answerId = uuidv4();

    const item = marshall({
      PK: `question#${questionId}`,
      SK: `answer#${answerId}`,
      answerId,
      questionId,
      text,
      answeredBy,
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
