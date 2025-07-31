// const jwtDecode = require('jwt-decode');

// function verifyToken(req, res, next) {
//   const authHeader = req.headers.authorization;

//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ error: 'Missing or invalid token' });
//   }

//   const token = authHeader.split(' ')[1];

//   try {
//     const decoded = jwtDecode(token);
//     req.user = decoded; // pass the user info to routes
//     next();
//   } catch (err) {
//     return res.status(403).json({ error: 'Invalid token' });
//   }
// }

// module.exports = verifyToken;

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { promisify } = require('util');

const EU_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const EU_REGION = process.env.AWS_REGION_EU;
const US_REGION = process.env.AWS_REGION_US;

// שים לב: כאן יש להזין את ה־POOL ID האמריקאי הידני (אין אותו בקובץ env שלך)
const US_POOL_ID = 'us-east-1_g82e0UGfB';

const ISSUERS = [
  `https://cognito-idp.${EU_REGION}.amazonaws.com/${EU_POOL_ID}`,
  `https://cognito-idp.${US_REGION}.amazonaws.com/${US_POOL_ID}`
];

const EU_JWKS_URI = `https://cognito-idp.${EU_REGION}.amazonaws.com/${EU_POOL_ID}/.well-known/jwks.json`;
const US_JWKS_URI = `https://cognito-idp.${US_REGION}.amazonaws.com/${US_POOL_ID}/.well-known/jwks.json`;

const EU_client = jwksClient({ jwksUri: EU_JWKS_URI });
const US_client = jwksClient({ jwksUri: US_JWKS_URI });

const getSigningKeyEU = promisify(EU_client.getSigningKey);
const getSigningKeyUS = promisify(US_client.getSigningKey);

async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  let decodedHeader;
  try {
    decodedHeader = jwt.decode(token, { complete: true });
    if (!decodedHeader || !decodedHeader.header.kid) {
      throw new Error("Invalid token header");
    }
  } catch (err) {
    return res.status(403).json({ error: "Token decode failed" });
  }

  const issuer = decodedHeader.payload.iss;

  try {
    const client = issuer.includes(EU_REGION) ? EU_client : US_client;
    const getKey = issuer.includes(EU_REGION) ? getSigningKeyEU : getSigningKeyUS;

    const key = await getKey(decodedHeader.header.kid);
    const signingKey = key.getPublicKey();

    jwt.verify(token, signingKey, { issuer: ISSUERS, algorithms: ["RS256"] }, (err, decoded) => {
      if (err) {
        console.error("Token verification error:", err);
        return res.status(403).json({ error: "Invalid token" });
      }
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error("Token verification failed:", err);
    return res.status(403).json({ error: "Token verification error" });
  }
}

module.exports = verifyToken;
