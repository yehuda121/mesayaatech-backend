// routes/reports/events-per-month.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

function getMonthKey(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

router.get('/', async (req, res) => {
  try {
    const eventsData = await ddb.send(new ScanCommand({ TableName: 'Events' }));
    const events = eventsData.Items.map(unmarshall);

    const eventsPerMonth = {};

    events.forEach(event => {
      const month = getMonthKey(event.date);
      eventsPerMonth[month] = (eventsPerMonth[month] || 0) + 1;
    });

    res.json(eventsPerMonth);
  } catch (err) {
    console.error('Error generating events report:', err);
    res.status(500).json({ error: 'Failed to generate events report' });
  }
});

module.exports = router;
