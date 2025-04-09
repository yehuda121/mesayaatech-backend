const express = require('express');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const cache = require('../utils/cache'); // 🧠 שימוש באותו קאש
const router = express.Router();
require('dotenv').config();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

router.post('/', async (req, res) => {
  try {
    const { fullName, idNumber, userType, status: newStatus } = req.body;

    if (!fullName || !idNumber || !userType || !newStatus) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const folderName = `${fullName.trim().replace(/\s+/g, '-')}-${idNumber.trim()}`;
    const key = `mesayaatech-users-data/${userType}s/${folderName}/registration-form.json`;

    const getCommand = new GetObjectCommand({
      Bucket: 'mesayaatech-bucket',
      Key: key,
    });

    const response = await s3.send(getCommand);
    const fileContent = await streamToString(response.Body);
    const json = JSON.parse(fileContent);

    json.status = newStatus;

    const putCommand = new PutObjectCommand({
      Bucket: 'mesayaatech-bucket',
      Key: key,
      Body: JSON.stringify(json, null, 2),
      ContentType: 'application/json',
    });

    await s3.send(putCommand);

    // אפס את הקאש מיד
    cache.cachedUsers = null;
    cache.lastFetched = null;

    res.status(200).json({ message: 'Status updated inside registration-form.json' });
  } catch (err) {
    console.error('Failed to update status:', err);
    res.status(500).json({ error: 'Failed to update status in registration-form.json' });
  }
});

module.exports = router;
