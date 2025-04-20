const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const router = express.Router();

// Initialize the S3 client using environment credentials and region
const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'mesayaatech-bucket';
const PREFIX = 'events/';

// Function to sanitize the event title for use in a filename
const sanitizeTitleForFilename = (title) => {
  return title
    .trim() // delete leading/trailing spaces
    .replace(/\s+/g, '-')               // turn spaces into hyphens
    .replace(/[^a-zA-Z0-9א-ת-_]/g, ''); // remove forbidden characters
};

// Route to upload a new event to S3
router.post('/', async (req, res) => {
  console.log('Received request to create event');

  try {
    const event = req.body;

    // Validate required fields
    if (!event.title || !event.date) {
      console.log('Missing required fields');
      return res.status(400).json({ error: 'Missing required fields: title or date' });
    }

    // Sanitize title and construct the filename
    const cleanTitle = sanitizeTitleForFilename(event.title);
    const filename = `${event.date}-${cleanTitle}.json`;
    const key = `${PREFIX}${filename}`;
    const content = JSON.stringify(event, null, 2);

    console.log('Uploading to S3:', key);

    // Create and send the PutObject command to upload the file to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: 'application/json',
    });

    await s3.send(command);

    console.log('Event uploaded successfully');
    res.status(200).json({ message: 'Event uploaded successfully' });
  } catch (err) {
    console.error('Error uploading event:', err);
    res.status(500).json({ error: 'Failed to upload event', details: err.message });
  }
});

module.exports = router;
