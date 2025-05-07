const express = require('express');
const app = express();
const cors = require('cors');


const uploadJobs = require('./routes/jobs/upload-job');
const importJobs = require('./routes/jobs/import-jobs');

require('dotenv').config();

app.use(cors());
app.use(express.json());

// DynamoDB
app.use('/api/upload-registration-form', require('./routes/registrationForms/upload-registration-form'));
app.use('/api/imports-user-registration-form', require('./routes/registrationForms/imports-user-registration-form'));
app.use('/api/update-user-status', require('./routes/registrationForms/update-user-status'));
app.use('/api/update-event', require('./routes/events/update-event'));
app.use('/api/delete-event', require('./routes/events/delete-event'));
app.use('/api/import-events', require('./routes/events/import-events'));
app.use('/api/upload-event', require('./routes/events/upload-event'));

app.use('/api/update-user-form', require('./routes/registrationForms/update-user-form'));
app.use('/api/delete-user-form', require('./routes/registrationForms/delete-user-form'));
//S3
app.use('/api/jobs', uploadJobs);          
app.use('/api/import-jobs', importJobs); 

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
