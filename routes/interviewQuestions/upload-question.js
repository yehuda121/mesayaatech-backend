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
  try {
    const { text, category, createdBy, idNumber } = req.body;

    if (!text || !category || !createdBy || !idNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const createdAt = new Date().toISOString();
    const randomId = uuidv4();

    const questionId = `ques#${idNumber}#${randomId}`;
    const pk = `${idNumber}#${randomId}`;

    const item = marshall({
      PK: pk,
      SK: 'metadata',
      questionId,
      text,
      category,
      createdBy,
      idNumber,
      createdAt
    });

    const command = new PutItemCommand({
      TableName: 'InterviewQuestions',
      Item: item
    });

    await ddb.send(command);

    return res.status(200).json({ message: 'Question uploaded', questionId });
  } catch (err) {
    console.error('Error uploading question:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
