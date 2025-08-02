const express = require('express');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const router = express.Router();
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const db = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', verifyToken, async (req, res) => {
  const { fullName, idNumber, userType, status: newStatus } = req.body;

  if (!fullName || !idNumber || !userType || !newStatus) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const tableNameMap = {
    reservist: 'reservUserForms',
    mentor: 'mentorUserForms',
    ambassador: 'ambassadorUserForms',
  };

  const cleanType = userType.toLowerCase();
  const tableName = tableNameMap[cleanType];

  if (!tableName) {
    return res.status(400).json({ error: 'Invalid userType' });
  }

  const PK = `${cleanType}#${idNumber.trim()}`;
  const SK = 'registrationForm';

  const command = new UpdateItemCommand({
    TableName: tableName,
    Key: {
      PK: { S: PK },
      SK: { S: SK },
    },
    UpdateExpression: 'SET #s = :newStatus',
    ExpressionAttributeNames: {
      '#s': 'status',
    },
    ExpressionAttributeValues: {
      ':newStatus': { S: newStatus },
    },
  });

  try {
    await db.send(command);
    res.status(200).json({ message: 'Status updated successfully in DynamoDB' });
  } catch (err) {
    console.error('Failed to update status in DynamoDB:', err);
    res.status(500).json({ error: 'Failed to update status in DynamoDB' });
  }
});

module.exports = router;
