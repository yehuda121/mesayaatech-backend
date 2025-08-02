// routes/reports/interview-questions-summary.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: 'InterviewQuestions' }));
    const items = result.Items.map(unmarshall);

    let questionsCount = 0;
    let answersCount = 0;

    items.forEach(item => {
      if (item.SK === 'metadata') {
        questionsCount += 1;
      } else if (item.SK.startsWith('answer#')) {
        answersCount += 1;
      }
    });

    res.json({ questionsCount, answersCount });
  } catch (err) {
    console.error('Error fetching interview summary:', err);
    res.status(500).json({ error: 'Failed to fetch interview summary' });
  }
});

module.exports = router;
