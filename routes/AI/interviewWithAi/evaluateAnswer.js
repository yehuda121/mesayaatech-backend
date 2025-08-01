const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const fs = require('fs');
const path = require('path');

const client = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Load prompt templates from JSON file
function getPromptText(category, difficulty, language) {
  const promptsPath = path.join(__dirname, 'interview_prompts.json');
  const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf-8'));

  if (prompts?.[category]?.[difficulty]?.[language]) {
    return prompts[category][difficulty][language];
  }

  throw new Error(`Prompt not found for ${category}/${difficulty}/${language}`);
}

// Clean up smart quotes, asterisks, invisible characters, etc.
function cleanJsonText(text) {
  return text
    .replace(/[“”]/g, '"')           // smart quotes
    .replace(/[\u200B-\u200D\uFEFF]/g, '')  // invisible characters
    .replace(/\*+/g, '')             // asterisks
    .trim();
}

// Parse structured plain text response from Claude
function parseStructuredText(text) {
  const scoreMatch = text.match(/score\s*[:=]\s*(\d+)/i);
  const posMatch = text.match(/positive\s*[:=]\s*["']?(.+?)["']?(\n|$)/i);
  const negMatch = text.match(/negative\s*[:=]\s*["']?(.+?)["']?(\n|$)/i);
  const idealMatch = text.match(/ideal_answer\s*[:=]\s*["']?([\s\S]*?)["']?\s*$/i);

  return {
    score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
    feedback: {
      positive: posMatch ? posMatch[1].trim() : '',
      negative: negMatch ? negMatch[1].trim() : '',
    },
    idealAnswer: idealMatch ? idealMatch[1].trim() : '',
  };
}

// Main logic to evaluate user's answer using Claude
async function evaluateUserAnswer(question, userAnswer, language, category, difficulty) {
  const promptText = getPromptText(category, difficulty, language);

  const instruction = language === 'he'
    ? `אל תצרף הסברים או תבניות Markdown. החזר טקסט פשוט בלבד. אם לא ניתן להשיב במבנה הנדרש, החזר טקסט ריק. ענה בפורמט הבא בלבד:
    score: מספר בין 1 ל-10 שבאמת משקף את הציון של התשובה על השאלה
    comments:
    positive: טקסט חיובי על התשובה (תמלא רק אם זה רלוונטי)
    negative: טקסט שלילי על התשובה (תמלא רק אם זה רלוונטי)
    ideal_answer: תשובה שלך על השאלה, תשובה אידיאלית וקצרה`
      : `Don't include explanations or Markdown. Respond in plain text only. If you cannot answer in the required structure, return an empty string. Use this exact format:
    score: A number between 1 and 10 that truly reflects the score of the answer to the question
    comments:
    positive: short positive feedback (Fill in only if relevant)
    negative: constructive feedback (Fill in only if relevant)
    ideal_answer: Your answer to the question, which should be ideally and short and to the point`;

  const fullPrompt = `${promptText}\n\n${instruction}\n\nQuestion: ${question}\nAnswer: ${userAnswer}`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 1024,
    }),
  });

  const response = await client.send(command);
  const rawBody = await response.body.transformToString();
//   console.log('Raw model response:', rawBody);
  const content = JSON.parse(rawBody).content?.[0]?.text?.trim() || '';

  if (!content || content.length < 10) {
    console.warn('Empty or too short response from Claude:', content);
    return {
      score: 0,
      feedback: {
        positive: '',
        negative: 'The model returned an empty or invalid response.',
      },
      idealAnswer: '',
    };
  }

  const parsed = parseStructuredText(content);

  return {
    score: parsed.score,
    feedback: parsed.feedback,
    idealAnswer: parsed.idealAnswer,
  };
}


module.exports = { evaluateUserAnswer };
