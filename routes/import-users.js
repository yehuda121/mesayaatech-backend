// routes/import-users.js
const express = require('express');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();

require('dotenv').config();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function getJsonFromS3(bucket, key) {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  const response = await s3.send(command);
  const stream = response.Body;
  const data = await new Promise((resolve, reject) => {
    let chunks = '';
    stream.on('data', (chunk) => chunks += chunk.toString());
    stream.on('end', () => resolve(chunks));
    stream.on('error', reject);
  });
  return JSON.parse(data);
}

router.get('/', async (req, res) => {
  try {
    const bucket = 'mesayaatech-bucket';
    const userTypes = ['mentors', 'reservists', 'ambassadors'];
    const users = [];

    for (const type of userTypes) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `mesayaatech-users-data/${type}/`,
      });

      const response = await s3.send(listCommand);
      const keys = response.Contents.map(obj => obj.Key);
      const folders = [...new Set(keys.map(key => key.split('/')[2]))];

      for (const folder of folders) {
        try {
          const registrationKey = `mesayaatech-users-data/${type}/${folder}/registration-form.json`;
          const statusKey = `mesayaatech-users-data/${type}/${folder}/status.txt`;

          const formData = await getJsonFromS3(bucket, registrationKey);
          let status = 'pending';

          try {
            const statusContent = await getJsonFromS3(bucket, statusKey);
            status = statusContent.trim();
          } catch (_) {}

          users.push({
            fullName: formData.fullName,
            idNumber: formData.idNumber,
            userType: type.slice(0, -1),
            status,
          });
        } catch (err) {
          console.error(`Error reading user folder ${type}/${folder}:`, err.message);
        }
      }
    }

    res.status(200).json(users);
  } catch (err) {
    console.error('Failed to import users:', err);
    res.status(500).json({ error: 'Import failed' });
  }
});

module.exports = router;