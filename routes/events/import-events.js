const express = require('express');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const router = express.Router();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'mesayaatech-bucket';
const PREFIX = 'events/';

// פונקציה לקרוא stream
const streamToString = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
};

// ייבוא כל האירועים הרלוונטיים מה־S3
router.get('/', async (req, res) => {
  try {
    const now = new Date();

    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: PREFIX,
    });

    const { Contents } = await s3.send(listCommand);
    if (!Contents) return res.status(200).json([]);

    const events = [];

    for (const obj of Contents) {
      const getCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: obj.Key,
      });

      const response = await s3.send(getCommand);
      const content = await streamToString(response.Body);
      const event = JSON.parse(content);

      // רק אם האירוע לא עבר (כולל היום עצמו)
      const eventDate = new Date(`${event.date}T${event.time || '00:00'}`);
      const today = new Date(now.toDateString());

      if (eventDate >= today) {
        events.push(event);
      }
    }

    // מיון לפי תאריך קרוב → רחוק
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(events);
  } catch (err) {
    console.error('❌ שגיאה בייבוא אירועים:', err);
    res.status(500).json({ error: 'Failed to import events' });
  }
});

module.exports = router;
