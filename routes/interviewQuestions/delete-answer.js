const express = require('express');
const { DynamoDBClient, DeleteItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', verifyToken, async (req, res) => {
  const { questionId, answerId, userId, userType } = req.body;
  if (!questionId || !answerId || !userId || !userType) {
    return res.status(400).json({ error: 'Missing fields' });
  }

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

    const deleteCommand = new DeleteItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: `answer#${answerId}` }),
    });

    await ddb.send(deleteCommand);
    res.status(200).json({ message: 'Answer deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
});

module.exports = router;
