const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());

// === Jobs routes ===
app.use('/api/jobs', require('./routes/jobs/upload-job'));
app.use('/api/import-jobs', require('./routes/jobs/import-jobs'));
app.use('/api/delete-job', require('./routes/jobs/delete-job'));
app.use('/api/update-job', require('./routes/jobs/update-job'));
app.use('/api/jobs-by-publisherID', require('./routes/jobs/get-jobs-by-publisherID'));

// === Interview Questions routes ===
app.use('/api/upload-question', require('./routes/interviewQuestions/upload-question'));
app.use('/api/post-answer', require('./routes/interviewQuestions/post-answer'));
app.use('/api/get-questions', require('./routes/interviewQuestions/get-questions'));
app.use('/api/toggle-question-like', require('./routes/interviewQuestions/toggle-question-like'));
app.use('/api/update-question', require('./routes/interviewQuestions/update-question'));
app.use('/api/delete-question', require('./routes/interviewQuestions/delete-question'));

// === Registration Forms (DynamoDB) ===
app.use('/api/upload-registration-form', require('./routes/registrationForms/upload-registration-form'));
app.use('/api/get-user-form', require('./routes/registrationForms/get-user-form-by-roll-and-id'));
app.use('/api/imports-user-registration-form', require('./routes/registrationForms/imports-user-registration-form'));
app.use('/api/update-user-status', require('./routes/registrationForms/update-user-status'));
app.use('/api/update-user-form', require('./routes/registrationForms/update-user-form'));
app.use('/api/delete-user-form', require('./routes/registrationForms/delete-user-form'));

// === Events ===
app.use('/api/update-event', require('./routes/events/update-event'));
app.use('/api/delete-event', require('./routes/events/delete-event'));
app.use('/api/import-events', require('./routes/events/import-events'));
app.use('/api/upload-event', require('./routes/events/upload-event'));
app.use('/api/toggle-join-event', require('./routes/events/toggle-join-event'));

// === Users / Cognito ===
app.use('/api/delete-cognito-user', require('./routes/usersPool/delete-user'));
app.use('/api/approve-user', require('./routes/usersPool/approveUser'));
app.use('/api/assign-mentor', require('./routes/usersPool/assign-mentor'));
app.use('/api/filter-users', require('./routes/usersPool/filter-users'));
app.use('/api/get-my-reservists', require('./routes/usersPool/get-my-reservists'));

// === login ===
app.use('/api/login', require('./routes/login/login'));
app.use('/api/completeNewPassword', require('./routes/login/completeNewPassword'));
app.use('/api/forgot-password', require('./routes/login/forgot-password'));
app.use('/api/confirm-forgot-password', require('./routes/login/confirm-forgot-password'));

// === AI ===
app.use('/api/parse-job-text', require('./routes/AI/parseJobText'));
app.use('/api/extract-image-text', require('./routes/AI/extractImageText'));
app.use('/api/match-reservists-to-mentor', require('./routes/AI/match-reservists-to-mentor'));
// === Interview AI ===
app.use('/api/interview/evaluateAnswer', require('./routes/AI/interviewWithAi/evaluateAnswerAPI'));
app.use('/api/interview/getQuestion', require('./routes/AI/interviewWithAi/getQuestionAPI'));
app.use('/api/interview/fetch-questions-history', require('./routes/AI/interviewWithAi/fetch-questions-history'));

// === Mentorsip ===
app.use('/api/add-meeting', require('./routes/mentorship/add-meeting'));
app.use('/api/advance-stage', require('./routes/mentorship/advance-stage'));
app.use('/api/getMentorshipProgress', require('./routes/mentorship/getMentorshipProgress'));
app.use('/api/init-progress', require('./routes/mentorship/init-progress'));
app.use('/api/delete-meeting', require('./routes/mentorship/delete-meeting'));
app.use('/api/update-meeting', require('./routes/mentorship/update-meeting'));
app.use('/api/delete-progress', require('./routes/mentorship/delete-progress'));
app.use('/api/getAllProgress', require('./routes/mentorship/getAllProgress'));

// === Reports ===
app.use('/api/reports/top-job-publishers', require('./routes/reports/top-job-publishers'));
app.use('/api/reports/mentorship-meetings-summary', require('./routes/reports/mentorship-meetings-summary'));
app.use('/api/reports/reservists-profession-summary', require('./routes/reports/reservists-profession-summary'));
app.use('/api/reports/reservists-location-summary', require('./routes/reports/reservists-location-summary'));
app.use('/api/reports/interview-questions-summary', require('./routes/reports/interview-questions-summary'));
app.use('/api/reports/users-summary', require('./routes/reports/users-summary'));
app.use('/api/reports/reservists-registration-status', require('./routes/reports/reservists-registration-status'));
app.use('/api/reports/reservists-mentorship-status', require('./routes/reports/reservists-mentorship-status'));
app.use('/api/reports/jobs-per-month', require('./routes/reports/jobs-per-month'));
app.use('/api/reports/events-per-month', require('./routes/reports/events-per-month'));
app.use('/api/reports/events-participants-count', require('./routes/reports/events-participants-count'));

// === Start server ===
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
