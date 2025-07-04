const Tesseract = require('tesseract.js');

async function extractTextFromImage(buffer) {
  const result = await Tesseract.recognize(buffer, 'heb+eng', {
    logger: (m) => console.log(m), 
  });
  return result.data.text;
}

module.exports = { extractTextFromImage };
