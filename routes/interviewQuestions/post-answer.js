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

router.post('/', async (req, res) => {
  const { questionId, text, fullName, idNumber } = req.body;

  if (!questionId || !text?.trim() || !fullName || !idNumber) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const answerId = `${idNumber}#${uuidv4()}`;
  const createdAt = new Date().toISOString();

  const item = {
    PK: questionId,          
    SK: `answer#${answerId}`,
    answerId,
    text: text?.trim(),
    answeredBy: `${fullName}#${idNumber}`,
    answeredName: fullName,
    createdAt
  };

  const command = new PutItemCommand({
    TableName: 'InterviewQuestions',
    Item: marshall(item)
  });

  try {
    await ddb.send(command);
    return res.status(200).json({ message: 'Answer saved successfully' });
  } catch (err) {
    console.error('Error saving answer:', err);
    return res.status(500).json({ error: 'Failed to save answer' });
  }
});

module.exports = router;
