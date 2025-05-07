const express = require('express');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const router = express.Router();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper: Normalizes date to YYYY-MM-DD
const normalizeDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

router.get('/', async (req, res) => {
  const { from, to, title, includePast } = req.query;

  try {
    const now = new Date();
    const todayStr = normalizeDate(now);

    // Scan all events (can be optimized later with GSI)
    const command = new ScanCommand({
      TableName: 'Events',
      FilterExpression: 'begins_with(PK, :prefix)',
      ExpressionAttributeValues: {
        ':prefix': { S: 'event#' },
      },
    });

    const result = await ddb.send(command);
    let items = result.Items.map(item => {
      const unmarshalled = unmarshall(item);
      return {
        ...unmarshalled,
        eventId: unmarshalled.PK?.replace('event#', '') || ''
      };
    });    

    // Filter: by date (from / to)
    if (from || to) {
      items = items.filter(event => {
        const eventDate = normalizeDate(event.date || '');
        return (!from || eventDate >= from) && (!to || eventDate <= to);
      });
    }

    // Filter: by title keyword (case insensitive)
    if (title) {
      const lowered = title.toLowerCase();
      items = items.filter(event =>
        event.title && event.title.toLowerCase().includes(lowered)
      );
    }

    // Filter: exclude past events unless explicitly included
    if (!includePast || includePast === 'false') {
      items = items.filter(event => {
        const eventDate = normalizeDate(event.date || '');
        return eventDate >= todayStr;
      });
    }

    // Sort by date
    items.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.status(200).json(items);
  } catch (err) {
    console.error('Failed to fetch events:', err);
    res.status(500).json({ error: 'Server error while fetching events' });
  }
});

module.exports = router;
