const express = require('express');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const cache = require('../../utils/chache');
const router = express.Router();
require('dotenv').config();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const CACHE_TTL_MS = 60 * 1000; // 1 דקה cache

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

async function fetchAllUsersFromS3() {
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
        const formData = await getJsonFromS3(bucket, registrationKey);
        const status = formData.status || 'pending';

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

  return users;
}

router.get('/', async (req, res) => {
  try {
    const now = Date.now();

    if (!cache.cachedUsers || now - cache.lastFetched > CACHE_TTL_MS) {
      console.log('🔄 Fetching fresh users from S3...');
      cache.cachedUsers = await fetchAllUsersFromS3();
      cache.lastFetched = now;
    } else {
      console.log('✅ Serving users from cache');
    }

    res.status(200).json(cache.cachedUsers);
  } catch (err) {
    console.error('Failed to import users:', err);
    res.status(500).json({ error: 'Import failed' });
  }
});

// רענון ידני אם תרצה
router.get('/refresh', async (req, res) => {
  cache.cachedUsers = await fetchAllUsersFromS3();
  cache.lastFetched = Date.now();
  res.json({ message: 'Cache refreshed manually' });
});

module.exports = router;
