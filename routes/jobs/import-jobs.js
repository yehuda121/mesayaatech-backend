const express = require('express');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
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

// Convert stream to string
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

// Route to fetch all jobs
router.get('/', async (req, res) => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: PREFIX,
    });

    const { Contents } = await s3.send(listCommand);
    if (!Contents) return res.status(200).json([]);

    const jobs = [];

    for (const obj of Contents) {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: obj.Key,
      });

      const response = await s3.send(getCommand);
      const content = await streamToString(response.Body);
      const job = JSON.parse(content);

      jobs.push(job);
    }

    // Sort jobs by upload date (newest first if wanted)
    jobs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.status(200).json(jobs);
  } catch (err) {
    console.error('Error importing jobs:', err);
    res.status(500).json({ error: 'Failed to import jobs' });
  }
});

module.exports = router;
