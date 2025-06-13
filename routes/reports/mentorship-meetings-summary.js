// routes/reports/mentorship-meetings-summary.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: 'mentorshipProgress' }));
    const progressItems = result.Items.map(unmarshall);

    const meetingsCount = progressItems.reduce((acc, item) => {
      const count = item.meetings ? item.meetings.length : 0;
      acc[count] = (acc[count] || 0) + 1;
      return acc;
    }, {});

    res.json(meetingsCount);
  } catch (err) {
    console.error('Error fetching meetings summary:', err);
    res.status(500).json({ error: 'Failed to fetch meetings summary' });
  }
});

module.exports = router;
