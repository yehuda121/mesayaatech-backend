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

// Load prompt template from interview_prompts.json
function getPrompt(category, difficulty, language) {
  const promptsPath = path.join(__dirname, '..', 'data', 'interview_prompts.json');
  const raw = fs.readFileSync(promptsPath, 'utf-8');
  const prompts = JSON.parse(raw);

  if (prompts?.[category]?.[difficulty]?.[language]) {
    return prompts[category][difficulty][language];
  }

  throw new Error(`Prompt not found for ${category}/${difficulty}/${language}`);
}

// Ask Claude to generate an interview question
async function getInterviewQuestion(category, difficulty, language) {
  const prompt = getPrompt(category, difficulty, language);

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
    }),
  });

  const response = await client.send(command);
  const rawBody = await response.body.transformToString();
  const responseBody = JSON.parse(rawBody);
  return responseBody.content?.[0]?.text || '';
}

module.exports = { getInterviewQuestion };
