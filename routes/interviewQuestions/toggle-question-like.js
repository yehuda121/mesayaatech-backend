const express = require('express');
const { DynamoDBClient, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { questionId, idNumber, fullName } = req.body;

  if (!questionId || !idNumber || !fullName) {
    return res.status(400).json({ error: 'Missing questionId, idNumber or fullName' });
  }
  try {
    // Fetch existing question
    const getCmd = new GetItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: questionId, SK: 'metadata' }),
    });

    const result = await ddb.send(getCmd);
    if (!result.Item) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const question = unmarshall(result.Item);
    const likes = question.likes || [];

    // Check if already liked
    const alreadyLiked = likes.some(like => like.idNumber === idNumber);

    // Update likes array
    const updatedLikes = alreadyLiked
      ? likes.filter(like => like.idNumber !== idNumber)
      : [...likes, { idNumber, fullName, likedAt: new Date().toISOString() }];

    const updateCmd = new UpdateItemCommand({
        TableName: 'InterviewQuestions',
        Key: marshall({ PK: questionId, SK: 'metadata' }),
        UpdateExpression: 'SET #likes = :likes',
        ExpressionAttributeNames: { '#likes': 'likes' },
        ExpressionAttributeValues: {
            ':likes': { L: updatedLikes.map(like => ({ M: marshall(like) })) }
        },
    });


    await ddb.send(updateCmd);
    return res.status(200).json({ message: 'Like toggled successfully' });
  } catch (err) {
    console.error('Error toggling like:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
