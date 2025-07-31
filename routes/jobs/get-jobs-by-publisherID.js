const express = require('express');
const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});


router.get('/by-publisher', verifyToken, async (req, res) => {
  const { publisherId, idType } = req.query;

  if (!publisherId || !idType) {
    return res.status(400).json({ error: 'Missing publisherId or idType' });
  }

  try {
    const command = new QueryCommand({
      TableName: 'Jobs',
      IndexName: 'publisherIndex', 
      KeyConditionExpression: 'publisherId = :publisherId AND publisherType = :publisherType',
      ExpressionAttributeValues: {
        ':publisherId': { S: publisherId },
        ':publisherType': { S: idType },
      },
    });

    const result = await ddb.send(command);
    const jobs = result.Items.map(item => unmarshall(item));

    res.status(200).json(jobs);
  } catch (err) {
    console.error('Failed to fetch jobs by publisher:', err);
    res.status(500).json({ error: 'Server error while fetching jobs' });
  }
});

module.exports = router;
