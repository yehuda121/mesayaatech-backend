const express = require('express');
const { DynamoDBClient, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const router = express.Router();
const ddb = new DynamoDBClient({ region: process.env.AWS_REGION_EU, credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}});

router.post('/', verifyToken, async (req, res) => {
  const { questionId, answerId, updatedText, userId, userType } = req.body;
  if (!questionId || !answerId || !updatedText || !userId || !userType)
    return res.status(400).json({ error: 'Missing fields' });

  try {
    const getCommand = new GetItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: `answer#${answerId}` }),
    });

    const result = await ddb.send(getCommand);
    const answer = result.Item ? unmarshall(result.Item) : null;

    if (!answer) return res.status(404).json({ error: 'Answer not found' });

    const allowed =
      userType === 'admin' ||
      answer.answeredBy.endsWith(`#${userId}`);

    if (!allowed) return res.status(403).json({ error: 'Unauthorized' });

    const updateCommand = new UpdateItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: `answer#${answerId}` }),
      UpdateExpression: 'SET #text = :text',
      ExpressionAttributeNames: { '#text': 'text' },
      ExpressionAttributeValues: marshall({ ':text': updatedText }),
    });

    await ddb.send(updateCommand);
    res.status(200).json({ message: 'Answer updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update answer' });
  }
});

module.exports = router;
