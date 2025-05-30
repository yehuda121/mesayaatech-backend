const express = require('express');
const router = express.Router();
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
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
    const { jobId, updatedData, userId, userType } = req.body;

    if (!jobId || !updatedData || !userId || !userType) {
      return res.status(400).json({ error: 'Missing jobId or user info' });
    }

    const command = new UpdateItemCommand({
      TableName: 'Jobs',
      Key: {
        PK: { S: `job#${jobId}` },
        SK: { S: 'metadata' },
      },
      UpdateExpression: `
        SET 
          #title = :title,
          #description = :description,
          #company = :company,
          #location = :location,
          #category = :category,
          #attachmentUrl = :attachmentUrl
      `,
      ExpressionAttributeNames: {
        '#title': 'title',
        '#description': 'description',
        '#company': 'company',
        '#location': 'location',
        '#category': 'category',
        '#attachmentUrl': 'attachmentUrl',
      },
      ExpressionAttributeValues: marshall({
        ':title': updatedData.title,
        ':description': updatedData.description,
        ':company': updatedData.company || '',
        ':location': updatedData.location || '',
        ':category': updatedData.category || '',
        ':attachmentUrl': updatedData.attachmentUrl || '',
      })
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Job updated successfully' });
  } catch (err) {
    console.error('Update job failed:', err);
    res.status(500).json({ error: 'Failed to update job', details: err.message });
  }
});

module.exports = router;
