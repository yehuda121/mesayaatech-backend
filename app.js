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

// === Interview routes ===
app.use('/api/interview/question', require('./routes/interview/upload-question'));
app.use('/api/interview/answer', require('./routes/interview/upload-answer'));
app.use('/api/interview/questions', require('./routes/interview/get-questions'));

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
app.use('/api/join-to-event', require('./routes/events/join-to-event'));

// === Users / Cognito ===
app.use('/api/delete-cognito-user', require('./routes/usersPool/delete-user'));
app.use('/api/approve-user', require('./routes/usersPool/approveUser'));
app.use('/api/login', require('./routes/usersPool/login'));
app.use('/api/completeNewPassword', require('./routes/usersPool/completeNewPassword'));
app.use('/api/assign-mentor', require('./routes/usersPool/assign-mentor'));
app.use('/api/filter-users', require('./routes/usersPool/filter-users'));

// === AI / Jobs ===
app.use('/api/parse-job-text', require('./routes/AI/parseJobText'));
app.use('/api/extract-image-text', require('./routes/AI/extractImageText'));


// === Start server ===
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
