const express = require('express');
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

// Initialize Cognito client with region and credentials
const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION_EU,
  credentials: { 
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

router.post('/', verifyToken, async (req, res) => {
    const { email, name, role, idNumber } = req.body;

  // Validate input
  if (!email || !name || !role || !idNumber) {
    console.warn('Missing one or more required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // console.log(`Attempting to create Cognito user: ${email}, role: ${role}`);

  try {
    // Prepare the command to create user and send automatic email
    const command = new AdminCreateUserCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name },
        { Name: 'custom:role', Value: role },
        { Name: 'custom:idNumber', Value: idNumber }
      ],
      DesiredDeliveryMediums: ['EMAIL'], // Automatically sends a confirmation/invitation email
    //   MessageAction: 'RESEND' // or omit this line for default email on first creation
    });

    const response = await cognito.send(command);

    // console.log('Cognito user created successfully:', response.User);

    res.status(200).json({ message: 'User created in Cognito and invitation sent.' });

  } catch (err) {
    console.error('Cognito error:', err);

    // Forward the Cognito error message to the frontend for better debugging
    res.status(500).json({
      error: 'Failed to create user in Cognito',
      message: err.message || 'Unknown error'
    });
  }
});

module.exports = router;
