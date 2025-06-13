// routes/reports/reservists-mentorship-status.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: 'mentorshipProgress' }));
    const progressItems = result.Items.map(unmarshall);

    const stageCount = progressItems.reduce((acc, item) => {
      const stage = item.progressStage || 1;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});

    res.json(stageCount);
  } catch (err) {
    console.error('Error fetching mentorship status:', err);
    res.status(500).json({ error: 'Failed to fetch mentorship status' });
  }
});

module.exports = router;
