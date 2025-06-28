const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall, marshall } = require('@aws-sdk/util-dynamodb');
const { parseMatchPromptWithClaude } = require('../jobAutoFill/bedrockClient');

const db = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.get('/', async (req, res) => {
  const { mentorId } = req.query;
  if (!mentorId) return res.status(400).json({ error: 'Missing mentorId' });

  try {
    const mentorResult = await db.send(new GetItemCommand({
      TableName: 'mentorUserForms',
      Key: {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: 'registrationForm' }
      }
    }));

    if (!mentorResult.Item) return res.status(404).json({ error: 'Mentor not found' });
    const mentor = unmarshall(mentorResult.Item);

    const resResult = await db.send(new ScanCommand({ TableName: 'reservUserForms' }));
    const allReservists = resResult.Items.map(unmarshall);
    const availableReservists = allReservists.filter(r => !r.mentorId || r.mentorId === 'null' || r.mentorId === null);

    const matches = [];

    for (const reservist of availableReservists) {
      const matchKey = {
        PK: { S: `mentor#${mentorId}` },
        SK: { S: `reservist#${reservist.idNumber}` }
      };

      // נסה למצוא תוצאה שמורה קודם
      const existing = await db.send(new GetItemCommand({
        TableName: 'mentorMatchScores',
        Key: matchKey
      }));

      if (existing.Item) {
        const matchData = unmarshall(existing.Item);
        matches.push({ ...reservist, ...matchData });
        continue;
      }

      // אחרת – חישוב חדש
      try {
        const aiResult = await parseMatchPromptWithClaude(mentor, reservist);
        const matchItem = {
          PK: `mentor#${mentorId}`,
          SK: `reservist#${reservist.idNumber}`,
          matchScore: aiResult.matchScore || 0,
          scoreBreakdown: aiResult.scoreBreakdown || {},
          matchingReasons: aiResult.matchingReasons || [],
          matchedFields: aiResult.matchedFields || [],
          keywordsMatched: aiResult.keywordsMatched || [],
          createdAt: new Date().toISOString()
        };

        await db.send(new PutItemCommand({
          TableName: 'mentorMatchScores',
          Item: marshall(matchItem)
        }));

        matches.push({ ...reservist, ...matchItem });
      } catch (err) {
        console.error(`AI error for ${reservist.idNumber}:`, err.message);
        matches.push({ ...reservist, matchScore: 0, matchingReasons: ['AI error'] });
      }
    }

    matches.sort((a, b) => b.matchScore - a.matchScore);
    res.json(matches);
  } catch (err) {
    console.error('Match error:', err);
    res.status(500).json({ error: 'Server error while matching' });
  }
});

module.exports = router;
