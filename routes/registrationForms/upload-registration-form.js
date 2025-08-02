const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

// Initialize DynamoDB client
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Route to upload registration form
router.post('/', async (req, res) => {
  try {
    const formData = req.body;
    const { userType, idNumber, fullName, email, status } = formData;

    // Basic presence check
    if (!userType || !idNumber || !fullName || !email || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate allowed values
    const allowedUserTypes = ['reservist', 'mentor', 'ambassador'];
    const allowedStatuses = ['pending', 'approved', 'denied'];

    const cleanType = userType.toLowerCase();
    const cleanStatus = status.toLowerCase();

    if (!allowedUserTypes.includes(cleanType)) {
      return res.status(400).json({ error: `Invalid userType: ${userType}` });
    }
    if (!allowedStatuses.includes(cleanStatus)) {
      return res.status(400).json({ error: `Invalid status: ${status}` });
    }

    const tableNameMap = {
      reservist: 'reservUserForms',
      mentor: 'mentorUserForms',
      ambassador: 'ambassadorUserForms',
    };

    const tableName = tableNameMap[cleanType];

    // Build item with all form data
    const item = {
      ...formData,
      userType: cleanType,
      status: cleanStatus,
      PK: `${cleanType}#${idNumber.trim()}`,
      SK: 'registrationForm',
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: tableName,
      Item: marshall(item),
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Form saved successfully' });

  } catch (err) {
    console.error('Error uploading to DynamoDB:', err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

module.exports = router;
