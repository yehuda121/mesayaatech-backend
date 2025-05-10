const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  try {
    const job = req.body;

    if (!job.title || !job.description || !job.publisherId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobId = uuidv4();
    const item = {
      PK: `job#${jobId}`,
      SK: 'metadata',
      jobId,
      title: job.title.trim(),
      description: job.description.trim(),
      company: job.company || '',
      location: job.location || '',
      category: job.category || '',
      postedAt: new Date().toISOString(),
      publisherId: job.publisherId,
      publisherType: job.publisherType || '', // e.g. "mentor"
      attachmentUrl: job.attachmentUrl || '', // optional image/PDF URL
    };

    const command = new PutItemCommand({
      TableName: 'Jobs',
      Item: marshall(item),
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Job saved successfully', jobId });
  } catch (err) {
    console.error('Error saving job:', err);
    res.status(500).json({ error: 'Failed to save job', details: err.message });
  }
});

module.exports = router;
