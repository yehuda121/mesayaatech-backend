// routes/reports/reservists-profession-summary.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: 'reservUserForms' }));
    const reservists = result.Items.map(unmarshall);

    const professionCount = reservists.reduce((acc, item) => {
      const profession = item.profession || 'unknown';
      acc[profession] = (acc[profession] || 0) + 1;
      return acc;
    }, {});

    res.json(professionCount);
  } catch (err) {
    console.error('Error fetching profession summary:', err);
    res.status(500).json({ error: 'Failed to fetch profession summary' });
  }
});

module.exports = router;
