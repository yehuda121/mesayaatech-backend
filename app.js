const express = require('express');
const app = express();
const cors = require('cors');

// const importUsers = require('./routes/users/import-users');
const updateUserStatus = require('./routes/registrationForms/update-user-status');
const events = require('./routes/events/import-events');
const deleteEvent = require('./routes/events/delete-event');
const uploadEvent = require('./routes/events/upload-event');

const uploadJobs = require('./routes/jobs/upload-job');
const importJobs = require('./routes/jobs/import-jobs');
const { DynamoDB } = require('aws-sdk');

require('dotenv').config();

app.use(cors());
app.use(express.json());

// DynamoDB
app.use('/api/upload-registration-form', require('./routes/registrationForms/upload-registration-form'));
app.use('/api/imports-user-registration-form', require('./routes/registrationForms/imports-user-registration-form'));

//S3
// app.use('/api/import-users', importUsers);
app.use('/api/update-status', updateUserStatus);
app.use('/api/import-events', events);
app.use('/api/delete-event', deleteEvent);
app.use('/api/upload-event', uploadEvent);

app.use('/api/jobs', uploadJobs);          
app.use('/api/import-jobs', importJobs); 

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
