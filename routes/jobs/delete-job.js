const express = require('express');
const router = express.Router();
const { DynamoDBClient, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { jobId, userId, userType } = req.body;
    if (!jobId || !userId || !userType) {
      return res.status(400).json({ error: 'Missing jobId or user data' });
    }
    
    const command = new DeleteItemCommand({
      TableName: 'Jobs',
      Key: marshall({ PK: `job#${jobId}`, SK: 'metadata' }),
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Delete job failed:', err);
    res.status(500).json({ error: 'Failed to delete job', details: err.message });
  }
});

module.exports = router;
