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
    const items = data.Items?.map(item => unmarshall(item)) || [];

    const questionsMap = {};

    items.forEach(item => {
      if (item.SK === 'metadata') {
        const questionId = item.PK.replace('question#', '');
        questionsMap[questionId] = {
          questionId,
          text: item.text,
          category: item.category,
          createdAt: item.createdAt,
          createdBy: item.createdBy,
          likes: item.likes || [],
          readBy: item.readBy || [],
          answers: [],
        };
      }
    });

    items.forEach(item => {
      if (item.SK.startsWith('answer#')) {
        const questionId = item.PK.replace('question#', '');

        const answer = {
          answerId: item.answerId,
          text: item.text,
          answeredBy: item.answeredBy,
          answeredName: item.answeredName,
          createdAt: item.createdAt,
        };

        if (!questionsMap[questionId]) {
          questionsMap[questionId] = {
            questionId,
            text: '(Question not loaded yet)',
            category: item.category || 'other',
            createdAt: null,
            createdBy: null,
            answers: [],
          };
        }

        questionsMap[questionId].answers.push(answer);
      }
    });

    const result = Object.values(questionsMap);
    // console.log("Loaded questions:", JSON.stringify(result, null, 2));
    return res.status(200).json(result);
  } catch (err) {
    console.error("Failed to fetch interview questions:", err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
