const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());

const uploadJob = require('./routes/jobs/upload-job');       
const importJobs = require('./routes/jobs/import-jobs');     
const deleteJob = require('./routes/jobs/delete-job');       
const updateJob = require('./routes/jobs/update-job'); 
// === Interview ===
const uploadQuestion = require('./routes/interview/upload-question');
console.log('uploadQuestion:', typeof uploadQuestion);
const uploadAnswer = require('./routes/interview/upload-answer');
console.log('uploadAnswer:', typeof uploadAnswer);
const getQuestions = require('./routes/interview/get-questions');
console.log('getQuestions:', typeof getQuestions);
// DynamoDB
app.use('/api/upload-registration-form', require('./routes/registrationForms/upload-registration-form'));
app.use('/api/get-user-form', require('./routes/registrationForms/get-user-form-by-roll-and-id'));
app.use('/api/imports-user-registration-form', require('./routes/registrationForms/imports-user-registration-form'));
app.use('/api/update-user-status', require('./routes/registrationForms/update-user-status'));
app.use('/api/delete-cognito-user', require('./routes/usersPool/delete-user'));


app.use('/api/update-event', require('./routes/events/update-event'));
app.use('/api/delete-event', require('./routes/events/delete-event'));
app.use('/api/import-events', require('./routes/events/import-events'));
app.use('/api/upload-event', require('./routes/events/upload-event'));
app.use('/api/join-to-event', require('./routes/events/join-to-event'));

app.use('/api/approve-user', require('./routes/usersPool/approveUser'));
app.use('/api/login', require('./routes/usersPool/login'));
app.use('/api/completeNewPassword', require('./routes/usersPool/completeNewPassword'));
app.use('/api/update-user-form', require('./routes/registrationForms/update-user-form'));
app.use('/api/delete-user-form', require('./routes/registrationForms/delete-user-form'));

app.use('/api/jobs', uploadJob);           
app.use('/api/import-jobs', importJobs);  
app.use('/api/delete-job', deleteJob);     
app.use('/api/update-job', updateJob);
// === Interview routes ===
app.use('/api/interview/question', uploadQuestion);
app.use('/api/interview/answer', uploadAnswer);
app.use('/api/interview/questions', getQuestions);





const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});