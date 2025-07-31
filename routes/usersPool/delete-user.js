const express = require('express');
const router = express.Router();
const verifyToken = require('../../utils/verifyToken');
const {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand
} = require('@aws-sdk/client-cognito-identity-provider');
require('dotenv').config();

const cognito = new CognitoIdentityProviderClient({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

router.post('/', verifyToken, async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    const listCommand = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1
    });

    const listResponse = await cognito.send(listCommand);

    if (listResponse.Users.length > 0) {
      const username = listResponse.Users[0].Username;

      const deleteCommand = new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: username
      });

      await cognito.send(deleteCommand);
      console.log(`Deleted Cognito user: ${username}`);
    } else {
      console.log(`User ${email} not found in Cognito`);
    }

    res.status(200).json({ message: 'User removed from Cognito if existed' });
  } catch (err) {
    console.error('Error deleting Cognito user:', err);
    res.status(500).json({ error: 'Failed to delete Cognito user', message: err.message });
  }
});

module.exports = router;
