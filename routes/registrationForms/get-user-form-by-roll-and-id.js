const express = require('express');
const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const router = express.Router();
require('dotenv').config();

const db = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const tableNameMap = {
  reservist: 'reservUserForms',
  mentor: 'mentorUserForms',
  ambassador: 'ambassadorUserForms',
};

// GET /api/get-user-form?userType=reservist&idNumber=123456789
router.get('/', async (req, res) => {
  const { userType, idNumber } = req.query;

  const cleanType = (userType || '').toLowerCase();
  const tableName = tableNameMap[cleanType];

  if (!tableName || !idNumber) {
    return res.status(400).json({ error: 'Missing or invalid userType or idNumber' });
  }

  const key = {
    PK: { S: `${cleanType}#${idNumber.trim()}` },
    SK: { S: 'registrationForm' },
  };

  try {
    const result = await db.send(
      new GetItemCommand({
        TableName: tableName,
        Key: key,
      })
    );

    if (!result.Item) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = unmarshall(result.Item);
    res.json(user);
  } catch (err) {
    console.error('DynamoDB get error:', err);
    res.status(500).json({ error: 'Failed to fetch user from DynamoDB' });
  }
});

module.exports = router;
