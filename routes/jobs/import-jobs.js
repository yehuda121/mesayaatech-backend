const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const router = express.Router();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get('/', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: 'Jobs',
      FilterExpression: 'begins_with(PK, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': { S: 'job#' },
      },
    });

    const result = await ddb.send(command);
    const jobs = result.Items.map(item => {
      const job = unmarshall(item);
      return {
        ...job,
        jobId: job.PK.replace('job#', '')
      };
    });

    res.status(200).json(jobs);
  } catch (err) {
    console.error('Failed to fetch jobs:', err);
    res.status(500).json({ error: 'Server error while fetching jobs' });
  }
});

module.exports = router;
