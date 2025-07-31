const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const router = express.Router();

require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
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

router.get('/all', async (req, res) => {
  try {
    const allData = [];

    for (const [userType, tableName] of Object.entries(tableNameMap)) {
      const data = await db.send(new ScanCommand({ TableName: tableName }));
      const users = data.Items.map(item => {
        const parsed = unmarshall(item);
        return { ...parsed, userType };
      });
      allData.push(...users);
    }

    res.json(allData);
  } catch (err) {
    console.error('DynamoDB scan error:', err);
    res.status(500).json({ error: 'Failed to fetch user data from all tables' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  const { userType, status } = req.query;

  const cleanType = (userType || '').toLowerCase();
  const tableName = tableNameMap[cleanType];

  if (!tableName) {
    return res.status(400).json({ error: 'Missing or invalid userType parameter' });
  }

  try {
    const data = await db.send(new ScanCommand({ TableName: tableName }));
    const allUsers = data.Items.map(item => unmarshall(item));

    const filtered = allUsers.filter(user => {
      const matchStatus = status ? user.status === status : true;
      return matchStatus;
    });

    res.json(filtered);
  } catch (err) {
    console.error('DynamoDB scan error:', err);
    res.status(500).json({ error: 'Failed to fetch user data from DynamoDB' });
  }
});

module.exports = router;
