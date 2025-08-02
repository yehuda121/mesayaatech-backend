// routes/reports/reservists-registration-status.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await ddb.send(new ScanCommand({ TableName: 'reservUserForms' }));
    const reservists = result.Items.map(unmarshall);

    const statusCount = reservists.reduce((acc, item) => {
      const status = item.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.json(statusCount);
  } catch (err) {
    console.error('Error fetching reservists registration status:', err);
    res.status(500).json({ error: 'Failed to fetch registration status' });
  }
});

module.exports = router;
