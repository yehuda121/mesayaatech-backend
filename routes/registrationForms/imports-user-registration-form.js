// // module.exports = router;
// const express = require('express');
// const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
// const router = express.Router();
// const s3 = new S3Client({
//   region: 'eu-north-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const streamToString = async (stream) => {
//   const chunks = [];
//   for await (const chunk of stream) chunks.push(chunk);
//   return Buffer.concat(chunks).toString('utf-8');
// };

// router.get('/', async (req, res) => {
//   const { userType, status } = req.query;
//   const allUsers = [];

//   const types = ['reservist', 'mentor', 'ambassador'];
//   const typesToScan = userType ? [userType] : types;

//   try {
//     for (const type of typesToScan) {
//       const listCommand = new ListObjectsV2Command({
//         Bucket: 'mesayaatech-bucket',
//         Prefix: `mesayaatech-users-data/${type}s/`,
//       });
//       const response = await s3.send(listCommand);

//       const folders = response.Contents.filter(obj => obj.Key.endsWith('registration-form.json'));

//       for (const file of folders) {
//         const key = file.Key;
//         try {
//           const data = await s3.send(new GetObjectCommand({ Bucket: 'mesayaatech-bucket', Key: key }));
//           const content = await streamToString(data.Body);
//           const parsed = JSON.parse(content);

//           if (!status || parsed.status === status) {
//             allUsers.push(parsed);
//           }
//         } catch (err) {
//           console.warn(`Problem reading ${key}:`, err.message);
//         }
//       }
//     }

//     res.json(allUsers);
//   } catch (err) {
//     console.error('Failed to fetch users:', err);
//     res.status(500).json({ error: 'Error fetching user data' });
//   }
// });
const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
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

// ✅ נתיב חדש: מביא את כל המשתמשים מכל הטבלאות
router.get('/all', async (req, res) => {
  try {
    const allData = [];

    for (const [userType, tableName] of Object.entries(tableNameMap)) {
      const data = await db.send(new ScanCommand({ TableName: tableName }));
      const users = data.Items.map(item => {
        const parsed = unmarshall(item);
        return { ...parsed, userType }; // מוסיף userType לתוצאה
      });
      allData.push(...users);
    }

    res.json(allData);
  } catch (err) {
    console.error('DynamoDB scan error:', err);
    res.status(500).json({ error: 'Failed to fetch user data from all tables' });
  }
});

// ✅ הנתיב הקיים: שליפה לפי userType וסטטוס
router.get('/', async (req, res) => {
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
