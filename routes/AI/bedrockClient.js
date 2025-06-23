const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');
const { buildPrompt, buildMatchPrompt  } = require('./promptBuilder');

const client = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function parseJobTextWithClaude(inputText) {
  const prompt = buildPrompt(inputText);

  const command = new InvokeModelCommand({
    // modelId: 'anthropic.claude-3-haiku-20240307',
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 1024,
    }),
  });

  const response = await client.send(command);
  const rawBody = await response.body.transformToString();
  const responseBody = JSON.parse(rawBody);
  const content = responseBody.content?.[0]?.text || '{}';

  // console.log('Raw response from Claude:', content);

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Claude returned non-JSON:', content);
    throw new Error('Claude did not return valid JSON');
  }
}
async function parseMatchPromptWithClaude(mentor, reservist) {
  const prompt = buildMatchPrompt(mentor, reservist); 

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
    }),
  });

  const response = await client.send(command);
  const rawBody = await response.body.transformToString();
  const responseBody = JSON.parse(rawBody);
  const content = responseBody.content?.[0]?.text || '{}';

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Claude did not return valid JSON');
  }
}

module.exports = {
  parseJobTextWithClaude,
  parseMatchPromptWithClaude 
};



