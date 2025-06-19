const { getInterviewQuestion } = require('./getQuestion');
const { saveQuestionSession, checkDailyLimit } = require('./interviewService');

module.exports = async (req, res) => {
  try {
    const { userId, email, category, difficulty, language } = req.body;

    if (!userId || !email || !category || !difficulty || !language) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const today = new Date().toISOString().split('T')[0];

    const limitExceeded = await checkDailyLimit(userId, today);
    if (limitExceeded) {
      return res.status(429).json({ error: 'Daily question limit reached' });
    }

    const question = await getInterviewQuestion(category, difficulty, language);

    await saveQuestionSession({
      userId,
      email,
      date: today,
      question,
      category,
      difficulty,
      language
    });

    return res.status(200).json({ question });

  } catch (err) {
    console.error('Error in get-question:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
