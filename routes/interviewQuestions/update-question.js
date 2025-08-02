const express = require('express');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// PUT /api/update-question
router.put('/', verifyToken, async (req, res) => {
  const { questionId, text, category } = req.body;

  if (!questionId || !text || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const updateCmd = new UpdateItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: 'metadata' }),
      UpdateExpression: 'SET #text = :text, #category = :category',
      ExpressionAttributeNames: {
        '#text': 'text',
        '#category': 'category'
      },
      ExpressionAttributeValues: marshall({
        ':text': text,
        ':category': category
      }),
    });

    await ddb.send(updateCmd);
    return res.status(200).json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error('Error updating question:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
