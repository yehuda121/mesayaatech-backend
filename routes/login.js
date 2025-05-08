const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: generateSecretHash(email)
      }
    });

    const response = await cognito.send(command);

    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      return res.status(200).json({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: response.Session
      });
    }

    const { AccessToken, IdToken } = response.AuthenticationResult;

    res.status(200).json({
      accessToken: AccessToken,
      idToken: IdToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(401).json({
      error: 'Login failed',
      message: err.message || 'Unknown error'
    });
  }
});

module.exports = router;
