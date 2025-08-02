const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall, marshall } = require('@aws-sdk/util-dynamodb');

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION_US });
const TABLE_NAME = 'interviewSessions';

module.exports = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const today = new Date().toISOString().split('T')[0];

    const queryCommand = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: marshall({
        ':pk': `user#${userId}`,
      }),
    });

    const response = await dynamo.send(queryCommand);
    const items = response.Items?.map(unmarshall) || [];

    const history = items
      .filter(item => item.answered)
      .sort((a, b) => a.SK.localeCompare(b.SK))
      .map(item => ({
        question: item.question,
        userAnswer: item.userAnswer,
        score: item.score,
        feedback: item.feedback,
        idealAnswer: item.idealAnswer,
        date: item.date,
        category: item.category,
        difficulty: item.difficulty,
        avgScore: item.avgScore
    }));

    const todayCount = items.filter(item => item.SK.startsWith(`question#${today}`)).length;

    return res.status(200).json({ history, todayCount });
  } catch (err) {
    console.error('Error in fetch-history:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
