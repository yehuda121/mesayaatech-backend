const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION_EU,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const crypto = require('crypto');

function generateSecretHash(username) {
  return crypto
    .createHmac('SHA256', process.env.COGNITO_CLIENT_SECRET)
    .update(username + process.env.COGNITO_CLIENT_ID)
    .digest('base64');
}

router.post('/', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const command = new ForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      SecretHash: generateSecretHash(email)
    });

    await cognito.send(command);

    res.status(200).json({ message: 'Verification code sent' });
  } catch (err) {
    console.error('Forgot password error:', err);

    if (err.name === 'UserNotFoundException') {
      return res.status(404).json({ error: 'Email not found in the system' });
    }

    res.status(500).json({
      error: 'Failed to send verification code',
      message: err.message
    });
  }
});

module.exports = router;
