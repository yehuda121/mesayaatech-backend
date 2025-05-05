// // module.exports = router;
// const express = require('express');
// const router = express.Router();
// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// require('dotenv').config();

// // Initialize S3 client with credentials and region from environment variables
// const s3 = new S3Client({
//   region: 'eu-north-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// // Route to upload a user's registration form to S3
// router.post('/', async (req, res) => {
//   try {
//     const formData = req.body;
//     const content = JSON.stringify(formData, null, 2);

//     // Sanitize full name for use in folder name
//     const fullNameClean = formData.fullName.trim().replace(/\s+/g, '-');
//     const id = formData.idNumber.trim();

//     // Ensure userType is one of the accepted values
//     const userType = formData.userType?.toLowerCase(); // 'reservist' / 'mentor' / 'ambassador'

//     if (!userType || !['reservists', 'mentors', 'ambassadors'].includes(userType + 's')) {
//       return res.status(400).json({ error: 'Invalid or missing userType' });
//     }

//     // Create folder name using sanitized full name and ID
//     const folderName = `${fullNameClean}-${id}`;

//     // Build the full S3 key for the registration form
//     const key = `mesayaatech-users-data/${userType}s/${folderName}/registration-form.json`;

//     // Create S3 PutObject command
//     const command = new PutObjectCommand({
//       Bucket: 'mesayaatech-bucket',
//       Key: key,
//       Body: content,
//       ContentType: 'application/json',
//     });

//     // Upload the object to S3
//     await s3.send(command);

//     res.status(200).json({ message: 'Form saved to S3 successfully' });
//   } catch (err) {
//     console.error('Error uploading to S3:', err);
//     res.status(500).json({ error: 'Error uploading to S3' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

require('dotenv').config();

// Initialize DynamoDB client
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Route to upload a user's registration form to DynamoDB
router.post('/', async (req, res) => {
  try {
    const formData = req.body;
    // Validate required fields
    const requiredFields = ['userType', 'status', 'fullName', 'idNumber', 'email'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const userType = formData.userType.toLowerCase(); // 'reservist', 'mentor', 'ambassador'
    const status = formData.status.toLowerCase(); // usually 'pending', 'approved', etc.
    const idNumber = formData.idNumber.trim();

    const item = {
      PK: `${userType}#${idNumber}`,   // Partition Key
      SK: status,                   // Sort Key
      idNumber: formData.idNumber.trim(),
      fullName: formData.fullName.trim(),
      phone: formData.phone || '',
      armyRole: formData.armyRole || '',
      location: formData.location || '',
      fields: formData.fields || [],
      experience: formData.experience || '',
      linkedin: formData.linkedin || '',
      notes: formData.notes || '',
      createdAt: new Date().toISOString(),
    };

    const command = new PutItemCommand({
      TableName: 'userForms',
      Item: marshall(item),
    });

    await ddb.send(command);
    res.status(200).json({ message: 'Form saved to DynamoDB successfully' });

  } catch (err) {
    console.error('Error uploading to DynamoDB:', err);
    res.status(500).json({ error: 'Error saving to database' });
  }
});

module.exports = router;
