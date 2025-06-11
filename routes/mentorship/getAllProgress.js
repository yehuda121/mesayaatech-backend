// routes/progress/getAllProcess.js

const express = require('express');
const { DynamoDBClient, ScanCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
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

    const fullData = await Promise.all(items.map(async (item) => {
      const mentorId = item.PK.replace('mentor#', '');
      const reservistId = item.SK.replace('reservist#', '');

      let mentorName = '';
      try {
        const mentorCommand = new GetItemCommand({
          TableName: 'mentorUserForms',
          Key: { PK: { S: `mentor#${mentorId}` } }
        });
        const mentorData = await ddb.send(mentorCommand);
        if (mentorData.Item) {
          const mentor = unmarshall(mentorData.Item);
          mentorName = mentor.fullName || '';
        }
      } catch (err) {
        console.error('Error fetching mentor:', err);
      }

      let reservistName = '';
      try {
        const reservCommand = new GetItemCommand({
          TableName: 'reservUserForms',
          Key: { PK: { S: `reservist#${reservistId}` } }
        });
        const reservData = await ddb.send(reservCommand);
        if (reservData.Item) {
          const reservist = unmarshall(reservData.Item);
          reservistName = reservist.fullName || '';
        }
      } catch (err) {
        console.error('Error fetching reservist:', err);
      }

      return {
        mentorId,
        reservistId,
        mentorName,
        reservistName,
        progressStage: item.progressStage || 0,
        meetings: item.meetings || []
      };
    }));

    res.json(fullData);
  } catch (err) {
    console.error('DynamoDB Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
