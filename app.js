const express = require('express');
const app = express();
const cors = require('cors');
const uploadRoute = require('./routes/upload-registration-form');
const importUsersRoute = require('./routes/import-users');
const updateStatusRoute = require('./routes/update-status');
const userFormRoute = require('./routes/user-form');

require('dotenv').config();

app.use(cors());
app.use(express.json());

app.use('/api/user-form', userFormRoute);
app.use('/api/upload', uploadRoute);
app.use('/api/import-users', importUsersRoute);
app.use('/api/update-status', updateStatusRoute);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
