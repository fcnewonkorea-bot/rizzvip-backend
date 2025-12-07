const express = require('express');
const multer  = require('multer');
const axios = require('axios');
const path = require('path');
const cors = require('cors');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.post('/deploy', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const siteName = (req.body.siteName || '').trim();
    const token = process.env.VERCEL_TOKEN || '';

    if(!token) return res.status(400).json({ error: 'VERCEL_TOKEN not set on server' });
    if(!file) return res.status(400).json({ error: 'No file uploaded' });
    if(!siteName) return res.status(400).json({ error: 'siteName required' });

    const content = file.buffer.toString('utf8');

    const payload = {
      name: siteName,
      files: [
        {
          file: 'index.html',
          data: content,
          encoding: 'utf-8'
        }
      ]
    };

    const createRes = await axios.post(
      'https://api.vercel.com/v13/deployments',
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const deployment = createRes.data;
    const url = deployment.url || null;

    res.json({
      success: true,
      url: url ? `https://${url}` : null,
      raw: deployment
    });

  } catch (err) {
    console.error('deploy error', err?.response?.data || err.message);
    res.status(500).json({
      error: 'Deployment failed',
      details: err?.response?.data || err.message
    });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});
