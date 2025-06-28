const express = require('express');
const router = express.Router();
const { parseJobTextWithClaude } = require('./bedrockClient');

router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const result = await parseJobTextWithClaude(text);
    res.json(result);
  } catch (err) {
    console.error('Claude parse error:', err);
    res.status(500).json({ error: 'Failed to parse text using Claude' });
  }
});

module.exports = router;
