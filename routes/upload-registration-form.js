// module.exports = router;
const express = require('express');
const router = express.Router();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

require('dotenv').config();

const s3 = new S3Client({
  region: 'eu-north-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

router.post('/', async (req, res) => {
  try {
    const formData = req.body;
    const content = JSON.stringify(formData, null, 2);

    const fullNameClean = formData.fullName.trim().replace(/\s+/g, '-');
    const id = formData.idNumber.trim();
    const userType = formData.userType?.toLowerCase(); // 'reservist' / 'mentor' / 'ambassador'

    if (!userType || !['reservists', 'mentors', 'ambassadors'].includes(userType + 's')) {
      return res.status(400).json({ error: 'userType שגוי או חסר' });
    }

    const folderName = `${fullNameClean}-${id}`;
    const key = `mesayaatech-users-data/${userType}s/${folderName}/registration-form.json`;

    const command = new PutObjectCommand({
      Bucket: 'mesayaatech-bucket',
      Key: key,
      Body: content,
      ContentType: 'application/json',
    });

    await s3.send(command);
    res.status(200).json({ message: 'הטופס נשמר ב־S3 בהצלחה' });
  } catch (err) {
    console.error('שגיאה בהעלאה ל-S3:', err);
    res.status(500).json({ error: 'שגיאה בהעלאה ל־S3' });
  }
});

module.exports = router;
