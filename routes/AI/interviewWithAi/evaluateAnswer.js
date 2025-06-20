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

function extractJsonFromText(text) {
  try {
    // Try parsing directly first
    return JSON.parse(text);
  } catch {
    // Try cleaning code block tags like ```json ... ```
    let cleaned = text.trim();

    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Try to extract the first valid JSON object
    const match = cleaned.match(/{[\s\S]*}/);
    if (match) {
      return JSON.parse(match[0]);
    }

    throw new Error("No valid JSON found");
  }
}

async function evaluateUserAnswer(question, userAnswer, language) {
  const prompt = `${language === 'he'
    ? `אתה מראיין שמקבל את השאלה והתשובה של המועמד. החזר JSON בלבד עם המבנה {"score": מספר, "comments": {"positive": "...", "negative": "..."}, "example_answer": "..."}. אין להוסיף טקסט חיצוני.` 
    : `You are an interviewer. Return only JSON in format {"score": number, "comments": {"positive": "...", "negative": "..."}, "example_answer": "..."}. No extra text.`}

{"question": "${question}", "answer": "${userAnswer}"}`;

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
  const content = responseBody.content?.[0]?.text?.trim() || '';

  try {
    const parsed = extractJsonFromText(content);
    return {
      score: parsed.score || 0,
      feedback: {
        positive: parsed.comments?.positive || '',
        negative: parsed.comments?.negative || '',
      },
      idealAnswer: parsed.example_answer || '',
    };
  } catch (err) {
    console.error('Invalid JSON from Claude:', content);
    throw new Error('Claude did not return valid JSON');
  }
}

module.exports = { evaluateUserAnswer };
