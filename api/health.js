export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const DEFAULT_USER = Buffer.from('cGhvbmcwOTgyOUBnbWFpbC5jb20=', 'base64').toString('utf-8');
  const EMAIL_USER = (process.env.EMAIL_USER || DEFAULT_USER).trim().toLowerCase();
  const isConfigured = Boolean(EMAIL_USER);

  return res.status(200).json({
    status: 'ok',
    server: 'FocusFlow Cloud Serverless API',
    emailConfigured: isConfigured,
    emailUser: EMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3')
  });
}
