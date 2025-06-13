// routes/reports/users-summary.js
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');

const ddb = new DynamoDBClient({ region: 'eu-north-1' });

router.get('/', async (req, res) => {
  try {
    const [reservists, mentors, ambassadors] = await Promise.all([
      ddb.send(new ScanCommand({ TableName: 'reservUserForms' })),
      ddb.send(new ScanCommand({ TableName: 'mentorUserForms' })),
      ddb.send(new ScanCommand({ TableName: 'ambassadorUserForms' }))
    ]);

    res.json({
      reservists: reservists.Count,
      mentors: mentors.Count,
      ambassadors: ambassadors.Count
    });
  } catch (err) {
    console.error('Error fetching users summary:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

module.exports = router;
