const express = require('express');
const { DynamoDBClient, ScanCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const router = express.Router();

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

router.get('/', async (req, res) => {
  const { userType, status, idNumber, email, filter } = req.query;

  const cleanType = (userType || '').toLowerCase();
  const tableName = tableNameMap[cleanType];

  if (!tableName) {
    return res.status(400).json({ error: 'Missing or invalid userType parameter' });
  }

  try {
    let users = [];

    if (idNumber) {
      const queryCommand = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': { S: `${cleanType}#${idNumber}` },
          ':sk': { S: 'registrationForm' },
        },
      });

      const result = await db.send(queryCommand);
      users = result.Items.map((item) => unmarshall(item));
    } else {
      const scanResult = await db.send(new ScanCommand({ TableName: tableName }));
      users = scanResult.Items.map((item) => unmarshall(item));
    }

    let filtered = users;

    if (status || email) {
      filtered = filtered.filter((user) => {
        const matchStatus = status ? user.status === status : true;
        const matchEmail = email ? user.email === email : true;
        return matchStatus && matchEmail;
      });
    }

    if (filter === 'availableForMentor' && cleanType === 'reservist') {
      filtered = filtered.filter((user) => {
        const approved = user.status === 'approved';
        const noMentor =
          !user.mentorId ||
          user.mentorId === '' ||
          user.mentorId === null;
        return approved && noMentor;
      });
    }

    res.json(filtered);
  } catch (err) {
    console.error('DynamoDB query/scan error:', err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

module.exports = router;
