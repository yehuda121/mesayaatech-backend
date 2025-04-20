const express = require('express');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const router = express.Router();

// Initialize the S3 client with region and credentials from environment variables
const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'mesayaatech-bucket';
const PREFIX = 'events/';

// Function to convert a readable stream into a string
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

// Route to import all relevant event files from S3
router.get('/', async (req, res) => {
  try {
    const now = new Date();

    // List all objects in the 'events/' prefix
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: PREFIX,
    });

    const { Contents } = await s3.send(listCommand);
    if (!Contents) return res.status(200).json([]);

    const events = [];

    for (const obj of Contents) {
      // Fetch each individual object from S3
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: obj.Key,
      });

      const response = await s3.send(getCommand);
      const content = await streamToString(response.Body);
      const event = JSON.parse(content);

      // Only include events that haven't passed (including today)
      const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
      const today = new Date(now.toDateString());

      if (eventDate >= today) {
        events.push(event);
      }
    }

    // Sort events by date (soonest to latest)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(events);
  } catch (err) {
    console.error('Error importing events:', err);
    res.status(500).json({ error: 'Failed to import events' });
  }
});

module.exports = router;
