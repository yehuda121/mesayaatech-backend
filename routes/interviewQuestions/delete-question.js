const express = require('express');
const router = express.Router();
const { DynamoDBClient, DeleteItemCommand, GetItemCommand, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
require('dotenv').config();

const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

router.post('/', async (req, res) => {
  const { questionId, idNumber, fullName } = req.body;
  if (!questionId || !idNumber || !fullName) {
    return res.status(400).json({ error: 'Missing questionId or user info' });
  }

  try {
    // שלב 1: חילוץ ה־PK לפי פורמט השאלה והתשובה
    const pk = questionId.replace(/^ques#/, '');

    // שלב 2: מחיקת השאלה עצמה
    await ddb.send(new DeleteItemCommand({
      TableName: 'InterviewQuestions',
      Key: marshall({ PK: pk, SK: 'metadata' }),
    }));

    // שלב 3: מחיקת כל התשובות עם אותו PK ו־SK שמתחיל ב־'answer#'
    const answersQuery = new QueryCommand({
      TableName: 'InterviewQuestions',
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': { S: pk }
      }
    });

    const answersData = await ddb.send(answersQuery);

    for (const item of answersData.Items) {
      const { SK } = unmarshall(item);
      if (SK.startsWith('answer#')) {
        await ddb.send(new DeleteItemCommand({
          TableName: 'InterviewQuestions',
          Key: marshall({ PK: pk, SK })
        }));
      }
    }

    return res.status(200).json({ message: 'Question and all related answers deleted' });

  } catch (err) {
    console.error('Error deleting question and answers:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
