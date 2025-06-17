const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const cognito = new CognitoIdentityProviderClient({
  region: 'eu-north-1',
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
  const { email, verificationCode, newPassword } = req.body;

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const command = new ConfirmForgotPasswordCommand({
      ClientId: process.env.COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: verificationCode,
      Password: newPassword,
      SecretHash: generateSecretHash(email)
    });

    await cognito.send(command);

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Confirm forgot password error:', err);
    res.status(500).json({
      error: 'Failed to reset password',
      message: err.message
    });
  }
});

module.exports = router;
