const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const router = express.Router();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get('/', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: 'InterviewQuestions',
    });

    const data = await ddb.send(command);
    console.log('📥 ScanCommand response:', JSON.stringify(data, null, 2));

    const questions = data.Items?.map(item => unmarshall(item)) || [];

    return res.status(200).json(questions);
  } catch (err) {
    console.error("❌ Failed to fetch questions:", err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
