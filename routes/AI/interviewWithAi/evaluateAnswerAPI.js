const { evaluateUserAnswer } = require('./evaluateAnswer');
const { updateAnswerEvaluation } = require('./interviewService');

module.exports = async (req, res) => {
  try {
    const { userId, question, userAnswer, language } = req.body;

    if (!userId || !question || !userAnswer || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const evaluation = await evaluateUserAnswer(question, userAnswer, language);

    await updateAnswerEvaluation(userId, {
      question,
      userAnswer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      idealAnswer: evaluation.idealAnswer,
    });

    return res.status(200).json(evaluation);

  } catch (err) {
    console.error('Error in evaluate-answer:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
