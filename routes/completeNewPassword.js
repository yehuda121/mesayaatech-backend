const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  RespondToAuthChallengeCommand
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
  const { email, newPassword, session } = req.body;

  if (!email || !newPassword || !session) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const command = new RespondToAuthChallengeCommand({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ClientId: process.env.COGNITO_CLIENT_ID,
        Session: session,
        ChallengeResponses: {
          USERNAME: email,
          NEW_PASSWORD: newPassword,
          SECRET_HASH: generateSecretHash(email)
        }
      });      

    const response = await cognito.send(command);
    res.status(200).json({ message: 'Password changed successfully', tokens: response.AuthenticationResult });
  } catch (err) {
    console.error('Error responding to new password challenge:', err);
    res.status(500).json({ error: 'Failed to complete password change', message: err.message });
  }
});

module.exports = router;
