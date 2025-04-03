const express = require('express');
const app = express();
const cors = require('cors');
const uploadRoute = require('./routes/upload-registration-form');
require('dotenv').config();

app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoute);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
