// module.exports = router;
const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const db = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
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

router.post('/', verifyToken, async (req, res) => {
  const formData = req.body;
  const { userType, idNumber } = formData;

  if (!userType || !idNumber) {
    return res.status(400).json({ error: 'Missing required fields: userType or idNumber' });
  }

  const cleanType = userType.toLowerCase();
  const tableName = tableNameMap[cleanType];

  if (!tableName) {
    return res.status(400).json({ error: 'Invalid userType' });
  }

  const item = {
    ...formData,
    PK: `${cleanType}#${idNumber.trim()}`,
    SK: 'registrationForm',
    updatedAt: new Date().toISOString(),
  };

  try {
    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
    });

    await db.send(command);
    res.status(200).json(item); 
  } catch (err) {
    console.error('Error updating user form:', err);
    res.status(500).json({ error: 'Failed to update user form in DynamoDB' });
  }
});

module.exports = router;
