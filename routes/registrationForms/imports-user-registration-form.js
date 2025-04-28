// routes/user-form.js
const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();

require('dotenv').config();

// Initialize the S3 client using credentials from environment variables
const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Route to fetch a user's registration form from S3
router.get('/', async (req, res) => {
  console.log("ROUTE HIT");

  const { userType, folder } = req.query;

  // Return error if required query parameters are missing
  if (!userType || !folder) {
    return res.status(400).json({ error: 'Missing userType or folder' });
  }

  // Build the S3 object key based on user type and folder
  const key = `mesayaatech-users-data/${userType}s/${folder}/registration-form.json`;

  try {
    // Fetch the registration form file from S3
    const command = new GetObjectCommand({ Bucket: 'mesayaatech-bucket', Key: key });
    const response = await s3.send(command);

    const stream = response.Body;
    let data = '';

    // Read the stream content
    stream.on('data', chunk => data += chunk);
    stream.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json); // Send the parsed JSON response
      } catch (err) {
        res.status(500).json({ error: 'Invalid JSON format' });
      }
    });

    // Handle stream errors
    stream.on('error', () => res.status(500).json({ error: 'Error reading file stream' }));

  } catch (err) {
    console.error('Error reading registration form:', err);
    res.status(500).json({ error: 'Unable to read registration form from S3' });
  }
});

module.exports = router;
