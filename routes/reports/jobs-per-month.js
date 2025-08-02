// routes/reports/jobs-per-month.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

function getMonthKey(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

router.get('/', verifyToken, async (req, res) => {
    try {
        const jobsData = await ddb.send(new ScanCommand({ TableName: 'Jobs' }));
        const jobs = jobsData.Items.map(unmarshall);

        const jobsPerMonth = {};

        jobs.forEach(job => {
        const month = getMonthKey(job.postedAt);
        jobsPerMonth[month] = (jobsPerMonth[month] || 0) + 1;
        });

        res.json(jobsPerMonth);
    } catch (err) {
        console.error('Error generating jobs report:', err);
        res.status(500).json({ error: 'Failed to generate jobs report' });
    }
});

module.exports = router;
