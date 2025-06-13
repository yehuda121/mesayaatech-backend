// routes/reports/reservists-location-summary.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: 'reservUserForms' }));
    const reservists = result.Items.map(unmarshall);

    const locationCount = reservists.reduce((acc, item) => {
      const location = item.location || 'unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    res.json(locationCount);
  } catch (err) {
    console.error('Error fetching location summary:', err);
    res.status(500).json({ error: 'Failed to fetch location summary' });
  }
});

module.exports = router;
