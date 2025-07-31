// get-subscribers.js
require('dotenv').config();

const express = require("express");
const router = express.Router();
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");
const { unmarshall } = require("@aws-sdk/util-dynamodb");
const verifyToken = require('../../../utils/verifyToken');
// Initialize DynamoDB client
const dynamo = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

/**
 * Retrieves subscribers from the "jobAlertsSubscribers" table.
 * Optionally filters the results by provided criteria.
 *
 * @param {Object} filters - Optional filters (e.g., { email, idNumber, field, name })
 * @returns {Promise<Object[]>} - Array of matching subscriber objects
 */
async function getSubscribers(filters = {}) {
  const scanParams = {
    TableName: "jobAlertsSubscribers",
  };

  try {
    const data = await dynamo.send(new ScanCommand(scanParams));
    const subscribers = data.Items.map(unmarshall);

    // Optional filtering
    const filtered = subscribers.filter(sub => {
      if (filters.idNumber && !sub.PK.endsWith(filters.idNumber)) return false;
      if (filters.email && sub.email !== filters.email) return false;
      if (filters.name && !sub.fullName?.includes(filters.name)) return false;
      if (filters.field && !sub.fieldsOfInterest?.includes(filters.field)) return false;
      return true;
    });

    // console.log(`Retrieved ${filtered.length} matching subscribers.`);
    return filtered;
  } catch (err) {
    console.error("Error retrieving subscribers:", err);
    throw err;
  }
}
 
// Handle GET /api/jobAlerts/get-subscribers with optional query parameters
router.get("/", verifyToken, async (req, res) => {
  try {
    const filters = {
      idNumber: req.query.idNumber,
      email: req.query.email,
      name: req.query.name,
      field: req.query.field,
    };
    const result = await getSubscribers(filters);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
