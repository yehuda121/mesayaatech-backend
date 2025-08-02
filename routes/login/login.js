const express = require('express');
const router = express.Router();
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand
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
  const { email, password } = req.body;

  // console.log('Received login request:');
  // console.log('Email:', email);
  // console.log('Password exists:', !!password);

  if (!email || !password) {
    console.warn('Missing email or password');
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const secretHash = generateSecretHash(email);

    // console.log('Generated secret hash');
    // console.log('Initiating auth with USER_PASSWORD_AUTH');

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });

    const response = await cognito.send(command);

    // console.log('Cognito response received');

    if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      console.warn('User requires NEW_PASSWORD_REQUIRED challenge');
      return res.status(200).json({
        challengeName: 'NEW_PASSWORD_REQUIRED',
        session: response.Session
      });
    }

    const { AccessToken, IdToken, RefreshToken } = response.AuthenticationResult;

    // console.log('Authentication successful');
    // console.log('AccessToken present:', !!AccessToken);
    // console.log('IdToken present:', !!IdToken);
    // console.log('RefreshToken present:', !!RefreshToken);

    res.status(200).json({
      accessToken: AccessToken,
      idToken: IdToken,
      refreshToken: RefreshToken
    });
  } catch (err) {
    // console.error('Login error occurred:');
    // console.error('Error type:', err.__type);
    // console.error('Error message:', err.message);
    // console.error('Full error:', err);
    res.status(401).json({
      error: 'Login failed',
      message: err.message || 'Unknown error'
    });
  }
});

module.exports = router;
