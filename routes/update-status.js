// routes/update-status.js
const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();

require('dotenv').config();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  try {
    const { fullName, idNumber, userType, status } = req.body;

    if (!fullName || !idNumber || !userType || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const folderName = `${fullName.trim().replace(/\s+/g, '-')}-${idNumber.trim()}`;
    const key = `mesayaatech-users-data/${userType}s/${folderName}/status.txt`;

    const command = new PutObjectCommand({
      Bucket: 'mesayaatech-bucket',
      Key: key,
      Body: status,
      ContentType: 'text/plain',
    });

    await s3.send(command);
    res.status(200).json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Failed to update status:', err);
    res.status(500).json({ error: 'Failed to update status in S3' });
  }
});

module.exports = router;
