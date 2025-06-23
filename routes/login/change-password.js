const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  ChangePasswordCommand
} = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const cognito = new CognitoIdentityProviderClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// החלפת סיסמה למשתמש מחובר
router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const { currentPassword, newPassword } = req.body;

  if (!authHeader || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing token or passwords' });
  }

  try {
    const command = new ChangePasswordCommand({
      PreviousPassword: currentPassword,
      ProposedPassword: newPassword,
      AccessToken: authHeader
    });

    await cognito.send(command);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      error: 'Failed to change password',
      message: err.message
    });
  }
});

module.exports = router;
