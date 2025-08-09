const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const router = express.Router();
require('dotenv').config();
const verifyToken = require('../../utils/verifyToken');
const s3 = new S3Client({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// AWS DynamoDB client
const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Configure multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/jobs
router.post('/', verifyToken, upload.single('attachment'), async (req, res) => {
  try {
    const jobId = uuidv4();
    const {
      company, location, role, minExperience, description,
      requirements, advantages, submitEmail, submitLink,
      companyWebsite, jobViewLink, publisherId, publisherType
    } = req.body;

    if (!publisherId || !publisherType) {
      console.warn("Missing required fields");
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let finalPublisherId = publisherType === 'admin' ? 'mesayaatech@gmail.com' : publisherId;

    let attachmentUrl = "";

    // If a file is attached, upload it to S3
    if (req.file) {
      const fileExt = path.extname(req.file.originalname);
      const key = `jobs/${jobId}${fileExt}`;

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
      publisherId: finalPublisherId,
      publisherType,
      postedAt: new Date().toISOString(),
      attachmentUrl,
    };
    // Only add minExperience if it's a valid number
    if (minExperience !== '' && !isNaN(minExperience)) {
      item.minExperience = parseInt(minExperience);
    }
    // Only add field if exists (you send it via req.body.field)
    if (req.body.field) {
      item.field = req.body.field;
    }

    try {
      const command = new PutItemCommand({
        TableName: 'Jobs',
        Item: marshall(item),
      });

      await ddb.send(command);
      // console.log("Job saved to DynamoDB:", jobId);

      //added for the job send
      try {
        // Send job alert email to subscribers
        const res = await fetch('http://localhost:5000/api/jobAlerts/send-job-alerts', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
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
