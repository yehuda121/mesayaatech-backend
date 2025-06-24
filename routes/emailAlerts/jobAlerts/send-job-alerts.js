// send-job-alerts.js

const express = require("express");
const router = express.Router();
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");

// Initialize AWS clients
const ses = new SESClient({ region: "us-east-1" });
const dynamo = new DynamoDBClient({ region: "us-east-1" });

/**
 * Basic security check to prevent sending malicious content.
 * Blocks <script>, javascript:, onerror=, iframes, and image onload.
 */
function isSafeContent(text) {
  const blacklist = [
    /<script.*?>/i,
    /javascript:/i,
    /onerror=/i,
    /<iframe/i,
    /<img.*?onload=/i,
  ];
  return !blacklist.some((regex) => regex.test(text));
}

/**
 * Main function to send job alerts via email
 * @param {string} message - The message content (HTML allowed, must be safe)
 * @param {string[]} relevantFields - List of job-related fields (e.g., ['Backend', 'DevOps'])
 */
async function sendJobAlerts(message, relevantFields) {
  // Security check
  if (!isSafeContent(message)) {
    throw new Error("Malicious content detected in email message.");
  }

  const UNSUBSCRIBE_NOTICE = `
    <p style="font-size: 12px; color: gray;">
        אם אינך מעוניין יותר לקבל עדכונים, ניתן להסיר את עצמך באזור האישי באתר.
    </p>
  `;

  // Scan all subscribers from DynamoDB table
  const scanParams = {
    TableName: "jobAlertsSubscribers",
  };
  const data = await dynamo.send(new ScanCommand(scanParams));
  const users = data.Items.map(unmarshall);

  // Filter users by matching at least one relevant field
  const filteredUsers = users.filter(
    (user) =>
      user.fieldsOfInterest &&
      user.email &&
      relevantFields.some((field) =>
        user.fieldsOfInterest.includes(field)
      )
  );

  // Send email to each matching user
  for (const user of filteredUsers) {
    const params = {
      Destination: {
        ToAddresses: [user.email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <p>שלום ${user.fullName || ""},</p>
              <p>${message}</p>
              ${UNSUBSCRIBE_NOTICE}
            `,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "התראה על משרה חדשה שמתאימה לתחום שבחרת",
        },
      },
      Source: "jobs@mesayaatech.org", // Make sure this is a verified sender in SES
    };

    try {
      await ses.send(new SendEmailCommand(params));
      console.log("Email sent to:", user.email);
    } catch (err) {
      console.error("Failed to send email to:", user.email, err);
    }
  }
}

// Handle POST /api/jobAlerts/send-job-alerts
router.post("/", async (req, res) => {
  const { message, fields } = req.body;

  if (!message || !Array.isArray(fields)) {
    return res.status(400).json({ error: "Missing message or fields array" });
  }

  try {
    await sendJobAlerts(message, fields);
    res.json({ success: true });
  } catch (err) {
    console.error("Error sending job alerts:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
