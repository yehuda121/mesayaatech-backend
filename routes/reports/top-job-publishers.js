const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

router.get('/', verifyToken, async (req, res) => {
  try {
    const jobsData = await ddb.send(new ScanCommand({ TableName: 'Jobs' }));
    const jobs = jobsData.Items.map(unmarshall);

    const publisherMap = {};

    jobs.forEach(job => {
      const publisherId = job.publisherId || 'unknown';
      const publisherType = job.publisherType || 'unknown';

      if (!publisherMap[publisherId]) {
        publisherMap[publisherId] = { publisherId, publisherType, count: 0 };
      }
      publisherMap[publisherId].count += 1;
    });

    const sorted = Object.values(publisherMap).sort((a, b) => b.count - a.count);
    res.json(sorted);
  } catch (err) {
    console.error('Error generating top publishers report:', err);
    res.status(500).json({ error: 'Failed to generate top publishers report' });
  }
});

module.exports = router;
