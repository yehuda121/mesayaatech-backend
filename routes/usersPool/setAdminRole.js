
// const {
//   CognitoIdentityProviderClient,
//   AdminUpdateUserAttributesCommand
// } = require('@aws-sdk/client-cognito-identity-provider');
// require('dotenv').config();

// const client = new CognitoIdentityProviderClient({
//   region: 'eu-north-1',
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//   }
// });

// const command = new AdminUpdateUserAttributesCommand({
//   UserPoolId: 'eu-north-1_YCEHEKx4D',
//   Username: 'mesayaatech@gmail.com',
//   UserAttributes: [
//     { Name: 'custom:role', Value: 'admin' },
//     { Name: 'name', Value: 'Admin' }
//   ]
// });

// client.send(command)
//   .then(() => console.log('Admin updated successfully'))
//   .catch(err => console.error('error: ', err));



// // node routes/usersPool/setAdminRole.js