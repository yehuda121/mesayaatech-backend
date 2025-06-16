// routes/progress/getAllProcess.js

const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const router = express.Router();
const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const scanCommand = new ScanCommand({
      TableName: 'mentorshipProgress'
    });
    const scanResult = await ddb.send(scanCommand);
    const items = (scanResult.Items || []).map(item => unmarshall(item));

    const fullData = items.map(item => {
      const mentorId = item.PK.replace('mentor#', '');
      const reservistId = item.SK.replace('reservist#', '');

      return {
        mentorId,
        reservistId,
        mentorName: item.mentorName || '',
        reservistName: item.reservistName || '',
        progressStage: item.progressStage || 0,
        meetings: item.meetings || []
      };
    });

    res.json(fullData);
  } catch (err) {
    console.error('DynamoDB Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
