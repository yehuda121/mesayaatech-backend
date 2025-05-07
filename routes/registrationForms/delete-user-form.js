// === delete-user-form.js ===
const express = require('express');
const router = express.Router();
const { DynamoDBClient, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
require('dotenv').config();

const db = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  const { userType, idNumber } = req.body;

  if (!userType || !idNumber) {
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

  try {
    const command = new DeleteItemCommand({
      TableName: tableName,
      Key: {
        PK: { S: PK },
        SK: { S: SK },
      },
    });

    await db.send(command);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Failed to delete user:', err);
    res.status(500).json({ error: 'Failed to delete user from DynamoDB' });
  }
});

module.exports = router;