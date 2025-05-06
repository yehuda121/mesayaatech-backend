const express = require('express');
const router = express.Router();
const {
  DynamoDBClient,
  DeleteItemCommand,
} = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

require('dotenv').config();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sanitizeTitleForKey = (title) => {
  return title.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9א-ת-_]/g, '');
};

router.post('/', async (req, res) => {
    try {
        console.log("trying to delete event");
        const { filename } = req.body;
        if (!filename) return res.status(400).json({ error: 'Missing filename' });
    
        const [date, ...titleParts] = filename.replace('.json', '').split('-');
        const cleanTitle = titleParts.join('-');
        const key = `${date}-${cleanTitle}`;
    
        const command = new DeleteItemCommand({
            TableName: 'Events',
            Key: marshall({ PK: `event#${key}`, SK: 'metadata' })
        });
    
        await ddb.send(command);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Delete failed:', err);
        res.status(500).json({ error: 'Failed to delete event', details: err.message });
    }
  });
  
  module.exports = router;
