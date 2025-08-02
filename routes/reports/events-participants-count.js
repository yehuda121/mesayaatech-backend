const express = require('express');
const router = express.Router();
const {
  DynamoDBClient,
  ScanCommand
} = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get('/', verifyToken, async (req, res) => {
  try {
    // console.log('Starting scan for events with SK = metadata');

    const command = new ScanCommand({
      TableName: 'Events',
      FilterExpression: 'SK = :metadata',
      ExpressionAttributeValues: {
        ':metadata': { S: 'metadata' }
      }
    });

    const response = await ddb.send(command);
    // console.log(`Scan response received. Total items: ${response.Items?.length || 0}`);

    if (!response.Items || response.Items.length === 0) {
      console.log('No matching events found in the Events table.');
      return res.status(200).json([]);
    }

    const result = response.Items.map((item, index) => {
      const event = unmarshall(item);
      console.log(`Event #${index + 1}:`, {
        title: event.title,
        date: event.date,
        participants: event.participants?.length || 0
      });

      return {
        title: event.title || 'Untitled',
        date: event.date || 'Unknown',
        count: Array.isArray(event.participants) ? event.participants.length : 0
      };
    });

    // console.log('Final result prepared:', result);
    res.status(200).json(result);

  } catch (err) {
    console.error('Error while fetching participants count:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

module.exports = router;
