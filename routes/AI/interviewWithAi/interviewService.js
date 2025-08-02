const { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION_EU });
const TABLE_NAME = 'interviewSessions';
const MAX_DAILY_QUESTIONS = 10;

//Check if the user exceeded the daily question limit
async function checkDailyLimit(userId, date) {
  const command = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: marshall({
      ':pk': `user#${userId}`,
      ':sk': `question#${date}`,
    }),
  });

  const response = await dynamo.send(command);
  const count = response.Items ? response.Items.length : 0;
  return count >= MAX_DAILY_QUESTIONS;
}

// Save a new interview question session
async function saveQuestionSession({ userId, email, date, question, category, difficulty, language }) {
  const timestamp = Date.now();
  const item = {
    PK: `user#${userId}`,
    SK: `question#${date}#${timestamp}`,
    userId,
    email,
    date,
    question,
    category,
    difficulty,
    language,
    scores: [],
    avgScore: null,
    answered: false
  };

  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: marshall(item),
  });

  await dynamo.send(command);
}

// Update the answer evaluation for a question
async function updateAnswerEvaluation(userId, { question, userAnswer, score, feedback, idealAnswer }) {
  const today = new Date().toISOString().split('T')[0];

  // Find the matching SK by querying today's questions
  const queryCommand = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: marshall({
      ':pk': `user#${userId}`,
      ':sk': `question#${today}`,
    }),
  });

  const response = await dynamo.send(queryCommand);
  const items = response.Items?.map(unmarshall) || [];

  const session = items.find(item => item.question === question && !item.answered);
  if (!session) {
    throw new Error('Matching session not found for update');
  }

  const newScores = [...(session.scores || []), score];
  const avg = Math.round((newScores.reduce((sum, s) => sum + s, 0) / newScores.length) * 100) / 100;

  const updateCommand = new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({
      PK: session.PK,
      SK: session.SK,
    }),
    UpdateExpression: 'SET userAnswer = :ans, score = :score, feedback = :fb, idealAnswer = :ideal, scores = :scores, avgScore = :avg, answered = :answered',
    ExpressionAttributeValues: marshall({
      ':ans': userAnswer,
      ':score': score,
      ':fb': feedback,
      ':ideal': idealAnswer,
      ':scores': newScores,
      ':avg': avg,
      ':answered': true,
    }),
  });

  await dynamo.send(updateCommand);
}

module.exports = {
  checkDailyLimit,
  saveQuestionSession,
  updateAnswerEvaluation
};
