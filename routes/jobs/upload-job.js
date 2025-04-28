const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const router = express.Router();

// Initialize S3 client
const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'mesayaatech-bucket';
const PREFIX = 'jobs/';

// Sanitize title for filename
const sanitizeTitleForFilename = (title) => {
  return title
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9א-ת-_]/g, '');
};

// Route to upload a new job
router.post('/', async (req, res) => {
  console.log('Received request to create job');

  try {
    const job = req.body;

    if (!job.title || !job.company) {
      return res.status(400).json({ error: 'Missing required fields: title or company' });
    }

    const cleanTitle = sanitizeTitleForFilename(job.title);
    const filename = `${Date.now()}-${cleanTitle}.json`; // Unique by timestamp
    const key = `${PREFIX}${filename}`;
    const content = JSON.stringify(job, null, 2);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: 'application/json',
    });

    await s3.send(command);

    console.log('Job uploaded successfully');
    res.status(200).json({ message: 'Job uploaded successfully' });
  } catch (err) {
    console.error('Error uploading job:', err);
    res.status(500).json({ error: 'Failed to upload job', details: err.message });
  }
});

module.exports = router;
