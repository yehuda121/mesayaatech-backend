// // update-user-form.js
// const express = require('express');
// const router = express.Router();
// const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
// const { marshall } = require('@aws-sdk/util-dynamodb');
// require('dotenv').config();

// const db = new DynamoDBClient({
//   region: 'eu-north-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// router.post('/', async (req, res) => {
//   const formData = req.body;
//   const { userType, idNumber } = formData;

//   if (!userType || !idNumber) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   const tableNameMap = {
//     reservist: 'reservUserForms',
//     mentor: 'mentorUserForms',
//     ambassador: 'ambassadorUserForms',
//   };

//   const cleanType = userType.toLowerCase();
//   const tableName = tableNameMap[cleanType];

//   if (!tableName) {
//     return res.status(400).json({ error: 'Invalid userType' });
//   }

//   const item = {
//     ...formData,
//     PK: `${cleanType}#${idNumber.trim()}`,
//     SK: 'registrationForm',
//     updatedAt: new Date().toISOString(),
//   };

//   try {
//     const command = new PutItemCommand({
//       TableName: tableName,
//       Item: marshall(item),
//     });

//     await db.send(command);
//     res.status(200).json({ message: 'User form updated successfully' });
//   } catch (err) {
//     console.error('Error updating user form:', err);
//     res.status(500).json({ error: 'Failed to update user form in DynamoDB' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const db = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// טבלת יעד לפי סוג משתמש
const tableNameMap = {
  reservist: 'reservUserForms',
  mentor: 'mentorUserForms',
  ambassador: 'ambassadorUserForms',
};

// מתאים לכולם (POST או PUT - כרגע POST)
router.post('/', async (req, res) => {
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
    res.status(200).json(item); // נחזיר את הנתון החדש ללקוח
  } catch (err) {
    console.error('Error updating user form:', err);
    res.status(500).json({ error: 'Failed to update user form in DynamoDB' });
  }
});

module.exports = router;
