const {
  BedrockRuntimeClient,
  InvokeModelCommand,
} = require('@aws-sdk/client-bedrock-runtime');

const client = new BedrockRuntimeClient({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Ask Claude to grade the user's answer
async function evaluateUserAnswer(question, userAnswer, language) {
  const evalPrompt = `${language === 'he'
    ? `אתה מראיין שמקבל את השאלה והתשובה של המועמד. תן ציון מ-1 עד 10, תן הערות קצרות מה טוב ומה לא טוב, והצג תשובה לדוגמה. ענה כ-JSON:`
    : `You are an interviewer who receives the interview question and the candidate's answer. Give a score from 1 to 10, brief feedback on what was good and what was lacking, and provide a model answer. Reply in JSON:`}
    { "question": "${question}", "answer": "${userAnswer}" }`;

  const command = new InvokeModelCommand({
    modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      anthropic_version: 'bedrock-2023-05-31',
      messages: [{ role: 'user', content: evalPrompt }],
      max_tokens: 1024,
    }),
  });

  const response = await client.send(command);
  const rawBody = await response.body.transformToString();
  const responseBody = JSON.parse(rawBody);
  const content = responseBody.content?.[0]?.text || '{}';

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('Invalid JSON from Claude:', content);
    throw new Error('Claude did not return valid JSON');
  }
}

module.exports = { evaluateUserAnswer };
