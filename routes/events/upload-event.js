const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
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

// פונקציה לניקוי כותרת לשם קובץ
const sanitizeTitleForFilename = (title) => {
  return title
    .trim() // delete leading spaces
    .replace(/\s+/g, '-')               // turn spaces into '-'
    .replace(/[^a-zA-Z0-9א-ת-_]/g, ''); // remove forbiden charecters
};

router.post('/', async (req, res) => {
  console.log('here');
  try {
    console.log(' בקשת יצירת אירוע התקבלה');
    const event = req.body;

    if (!event.title || !event.date) {
      console.log(' חסרים שדות חובה');
      return res.status(400).json({ error: 'Missing required fields: title or date' });
    }

    const cleanTitle = sanitizeTitleForFilename(event.title);
    const filename = `${event.date}-${cleanTitle}.json`;
    const key = `${PREFIX}${filename}`;
    const content = JSON.stringify(event, null, 2);

    console.log(' מעלה ל-S3:', key);

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: 'application/json',
    });

    await s3.send(command);

    console.log(' האירוע נשמר בהצלחה');
    res.status(200).json({ message: 'Event uploaded successfully' });
  } catch (err) {
    console.error(' שגיאה בשמירת האירוע:', err);
    res.status(500).json({ error: 'Failed to upload event', details: err.message });
  }
});

module.exports = router;
