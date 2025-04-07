// routes/user-form.js
const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const router = express.Router();

require('dotenv').config();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get('/', async (req, res) => {
    console.log("ROUTE HIT");
    const { userType, folder } = req.query;
    console.log("Looking for key:", `mesayaatech-users-data/${userType}s/${folder}/registration-form.json`);

  if (!userType || !folder) {
    return res.status(400).json({ error: 'Missing userType or folder' });
  }

  const key = `mesayaatech-users-data/${userType}s/${folder}/registration-form.json`;

  try {
    console.log("Looking for key:", key);
    const command = new GetObjectCommand({ Bucket: 'mesayaatech-bucket', Key: key });
    const response = await s3.send(command);

    const stream = response.Body;
    let data = '';
    stream.on('data', chunk => data += chunk);
    stream.on('end', () => {
      try {
        const json = JSON.parse(data);
        res.json(json);
      } catch (err) {
        res.status(500).json({ error: 'Invalid JSON format' });
      }
    });
    stream.on('error', () => res.status(500).json({ error: 'Error reading file stream' }));

  } catch (err) {
    console.error('Error reading registration form:', err);
    res.status(500).json({ error: 'Unable to read registration form from S3' });
  }
});

module.exports = router;
