const express = require('express');
const router = express.Router();
const { parseMatchPromptWithClaude } = require('../jobAutoFill/bedrockClient'); 
const verifyToken = require('../../../utils/verifyToken');

router.post('/', verifyToken, async (req, res) => {
  const { mentor, reservist } = req.body;
  if (!mentor || !reservist) {
    return res.status(400).json({ error: 'Missing mentor or reservist data' });
  }

  try {
    const result = await parseMatchPromptWithClaude(mentor, reservist);
    res.json(result); 
  } catch (err) {
    console.error('Claude match error:', err);
    res.status(500).json({ error: 'Failed to evaluate match using Claude' });
  }
});

module.exports = router;
