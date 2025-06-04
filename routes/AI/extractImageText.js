const express = require('express');
const multer = require('multer');
const router = express.Router();
const { extractTextFromImage } = require('./ocrService');
const { parseJobTextWithClaude } = require('./bedrockClient'); // ← חזרה ל־Claude

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const text = await extractTextFromImage(req.file.buffer);
    if (!text) throw new Error('Empty OCR result');

    const result = await parseJobTextWithClaude(text); // ← שינוי כאן
    res.json({ text, ...result });
  } catch (err) {
    console.error('Image OCR error:', err);
    res.status(500).json({ error: 'Failed to extract text from image' });
  }
});

module.exports = router;
