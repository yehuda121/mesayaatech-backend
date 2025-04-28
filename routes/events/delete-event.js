const express = require('express');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const router = express.Router();

// Initialize the S3 client with credentials and region from environment variables
const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Define the S3 bucket name and the prefix for event files
const BUCKET_NAME = 'mesayaatech-bucket';
const PREFIX = 'events/';

// Define a POST route to delete an event file from the S3 bucket
router.post('/', async (req, res) => {
  try {
    const { filename } = req.body;

    // Return error if no filename is provided
    if (!filename) return res.status(400).json({ error: 'Missing filename' });

    // Create the delete command for the specific file in the events/ folder
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: PREFIX + filename,
    });

    // Send the command to S3 to delete the object
    await s3.send(command);

    // Return a success response
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    // Log the error and return a server error response
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
