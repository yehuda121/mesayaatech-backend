// ================= AWS ================================
// // send-job-alerts.js

// const express = require("express");
// const router = express.Router();
// const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
// const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
// const { unmarshall } = require("@aws-sdk/util-dynamodb");
// const verifyToken = require('../../../utils/verifyToken');
// // Initialize AWS clients
// const ses = new SESClient({ region: process.env.AWS_REGION_US });
// const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

// /**
//  * Basic security check to prevent sending malicious content.
//  * Blocks <script>, javascript:, onerror=, iframes, and image onload.
//  */
// function isSafeContent(text) {
//   const blacklist = [
//     /<script.*?>/i,
//     /javascript:/i,
//     /onerror=/i,
//     /<iframe/i,
//     /<img.*?onload=/i,
//   ];
//   return !blacklist.some((regex) => regex.test(text));
// }

// /**
//  * Main function to send job alerts via email
//  * @param {string} message - The message content (HTML allowed, must be safe)
//  * @param {string[]} relevantFields - List of job-related fields (e.g., ['Backend', 'DevOps'])
//  */
// async function sendJobAlerts(message, relevantFields) {
//   // Security check
//   if (!isSafeContent(message)) {
//     throw new Error("Malicious content detected in email message.");
//   }

//   const UNSUBSCRIBE_NOTICE = `
//     <p style="font-size: 12px; color: gray;">
//         אם אינך מעוניין יותר לקבל עדכונים, ניתן להסיר את עצמך באזור האישי באתר.
//     </p>
//   `;

//   // Scan all subscribers from DynamoDB table
//   const scanParams = {
//     TableName: "jobAlertsSubscribers",
//   };
//   const data = await dynamo.send(new ScanCommand(scanParams));
//   const users = data.Items.map(unmarshall);

//   // Filter users by matching at least one relevant field
//   const filteredUsers = users.filter(
//     (user) =>
//       user.fieldsOfInterest &&
//       user.email &&
//       relevantFields.some((field) =>
//         user.fieldsOfInterest.includes(field)
//       )
//   );

//   // Send email to each matching user
//   for (const user of filteredUsers) {
//     const params = {
//       Destination: {
//         ToAddresses: [user.email],
//       },
//       Message: {
//         Body: {
//           Html: {
//             Charset: "UTF-8",
//             Data: `
//               <p>שלום ${user.fullName || ""},</p>
//               <p>${message}</p>
//               ${UNSUBSCRIBE_NOTICE}
//             `,
//           },
//         },
//         Subject: {
//           Charset: "UTF-8",
//           Data: "התראה על משרה חדשה שמתאימה לתחום שבחרת",
//         },
//       },
//       Source: "mesayaatech@gmail.com", 
//     };

//     try {
//       await ses.send(new SendEmailCommand(params));
//       console.log("Email sent to:", user.email);
//     } catch (err) {
//       console.error("Failed to send email to:", user.email, err);
//     }
//   }
// }

// // Handle POST /api/jobAlerts/send-job-alerts
// router.post("/", verifyToken, async (req, res) => {
//   const { message, fields } = req.body;

//   if (!message || !Array.isArray(fields)) {
//     return res.status(400).json({ error: "Missing message or fields array" });
//   }

//   try {
//     await sendJobAlerts(message, fields);
//     res.json({ success: true });
//   } catch (err) {
//     console.error("Error sending job alerts:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;
// ================= AWS ================================


// import 'dotenv/config';
require('dotenv').config();
const express = require('express');
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { Resend } = require('resend');
const verifyToken = require('../../../utils/verifyToken');

// DynamoDB (same region as before)
const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION_EU });

// Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Basic security check against obvious XSS payloads
function isSafeContent(text) {
  const blacklist = [
    /<script.*?>/i,
    /javascript:/i,
    /onerror=/i,
    /<iframe/i,
    /<img.*?onload=/i,
  ];
  return !blacklist.some((rx) => rx.test(text));
}

// Main sender
async function sendJobAlerts(message, relevantFields) {
  if (!isSafeContent(message)) {
    throw new Error('Malicious content detected in email message.');
  }

  const UNSUBSCRIBE_NOTICE = `
    <p style="font-size:12px;color:gray">
      אם אינך מעוניין/ת יותר לקבל עדכונים, אפשר להסיר באזור האישי באתר.
    </p>
  `;

  // Load subscribers
  const scanParams = { TableName: 'jobAlertsSubscribers' };
  const data = await dynamo.send(new ScanCommand(scanParams));
  const users = data.Items.map(unmarshall);

  // Filter by fields
  const filteredUsers = users.filter(
    (u) =>
      Array.isArray(u.fieldsOfInterest) &&
      u.email &&
      relevantFields.some((f) => u.fieldsOfInterest.includes(f))
  );

  // Send emails one by one via Resend
  for (const user of filteredUsers) {
    const htmlBody = `
      <p>שלום ${user.fullName || ''},</p>
      <p>${message}</p>
      ${UNSUBSCRIBE_NOTICE}
    `;

    try {
      await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: ['mesayaatech@gmail.com'],
        subject: 'התראה על משרה חדשה שמתאימה לתחום שבחרת',
        html: htmlBody,
      });
      console.log('Email sent to:', user.email);
    } catch (err) {
      console.error('Failed to send email to:', user.email, err?.message || err);
    }
  }
}

// POST /api/jobAlerts/send-job-alerts
router.post('/', verifyToken, async (req, res) => {
  const { message, fields } = req.body;
  if (!message || !Array.isArray(fields)) {
    return res.status(400).json({ error: 'Missing message or fields array' });
  }
  try {
    await sendJobAlerts(message, fields);
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending job alerts:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;




