// routes/reports/top-job-publishers.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const jobsData = await ddb.send(new ScanCommand({ TableName: 'Jobs' }));
    const jobs = jobsData.Items.map(unmarshall);

    const publisherCount = {};

    jobs.forEach(job => {
      const publisherId = job.publisherId || 'unknown';
      publisherCount[publisherId] = (publisherCount[publisherId] || 0) + 1;
    });

    const sorted = Object.entries(publisherCount)
      .sort((a, b) => b[1] - a[1])
      .map(([publisherId, count]) => ({ publisherId, count }));

    res.json(sorted);
  } catch (err) {
    console.error('Error generating top publishers report:', err);
    res.status(500).json({ error: 'Failed to generate top publishers report' });
  }
});

module.exports = router;
