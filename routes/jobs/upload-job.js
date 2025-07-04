const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const router = express.Router();
require('dotenv').config();

// AWS S3 client
const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// AWS DynamoDB client
const ddb = new DynamoDBClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/jobs
router.post('/', upload.single('attachment'), async (req, res) => {
  // console.log("Received job submission");

  try {
    // Debug logs
    // console.log("BODY:", req.body);
    // console.log("FILE:", req.file);

    const jobId = uuidv4();
    const {
      company, location, role, minExperience, description,
      requirements, advantages, submitEmail, submitLink,
      companyWebsite, jobViewLink, publisherId, publisherType
    } = req.body;


    if (!publisherId) {
      console.warn("Missing required fields");
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let attachmentUrl = "";

    // If a file is attached, upload it to S3
    if (req.file) {
      // console.log("Uploading file to S3...");

      const fileExt = path.extname(req.file.originalname);
      const key = `jobs/${jobId}${fileExt}`; // <- make sure prefix matches bucket expectation

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      try {
        await s3.send(new PutObjectCommand(uploadParams));
        attachmentUrl = `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
        console.log("File uploaded:", attachmentUrl);
      } catch (uploadErr) {
        console.error("Failed uploading to S3:", uploadErr);
        return res.status(500).json({ error: 'Failed uploading file to S3', details: uploadErr.message });
      }
    }

    // Save job data in DynamoDB
    const item = {
      PK: `job#${jobId}`,
      SK: 'metadata',
      jobId,
      company: company || '',
      location: location || '',
      role: role || '',
      minExperience: minExperience || '',
      description: description || '',
      requirements: requirements || '',
      advantages: advantages || '',
      submitEmail: submitEmail || '',
      submitLink: submitLink || '',
      companyWebsite: companyWebsite || '',
      jobViewLink: jobViewLink || '',
      publisherId,
      publisherType: publisherType || '',
      postedAt: new Date().toISOString(),
      attachmentUrl,
    };

    try {
      const command = new PutItemCommand({
        TableName: 'Jobs',
        Item: marshall(item),
      });

      await ddb.send(command);
      // console.log("Job saved to DynamoDB:", jobId);

      //added for the job send
      try {
        console.log("in the try");
        // Send job alert email to subscribers
        const res = await fetch('http://localhost:5000/api/jobAlerts/send-job-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `משרה חדשה פורסמה: ${role} בחברת ${company}.`,
            fields: [req.body.field] 
          })
        });
        console.log("sent", res);
      } catch (mailErr) {
        console.error("Failed to send job alert email:", mailErr.message);
      }

      return res.status(200).json({ message: 'Job created successfully', jobId, attachmentUrl });

    } catch (ddbErr) {
      console.error("Failed saving to DynamoDB:", ddbErr);
      return res.status(500).json({ error: 'Failed saving job to DB', details: ddbErr.message });
    }

  } catch (err) {
    console.error('General server error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message || err });
  }
});

module.exports = router;
