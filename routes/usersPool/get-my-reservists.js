const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');

const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get('/', verifyToken, async (req, res) => {
  const { mentorId } = req.query;

  if (!mentorId) {
    return res.status(400).json({ error: 'Missing mentorId' });
  }

  try {
    const scanCommand = new ScanCommand({
      TableName: 'reservUserForms',
      FilterExpression: 'mentorId = :mentor AND #status = :approved',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':mentor': { S: `mentor#${mentorId}` },
        ':approved': { S: 'approved' },
      },
    });

    const result = await ddb.send(scanCommand);
    const reservists = result.Items.map(item => unmarshall(item));

    res.status(200).json(reservists);
  } catch (err) {
    console.error('Error fetching reservists:', err);
    res.status(500).json({ error: 'Failed to fetch reservists' });
  }
});

module.exports = router;
