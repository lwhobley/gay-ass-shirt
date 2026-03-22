// api/upload-new-designs.js
// POST images to Printify via this endpoint (bypasses CORS/network restrictions)
// Usage: POST /api/upload-new-designs?secret=gas-upload-2024
// Body: { fileName: "name.png", contents: "data:image/png;base64,..." }

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');
  if (req.query.secret !== 'gas-upload-2024') return res.status(401).end('Unauthorized');

  const token = process.env.PRINTIFY_API_KEY;
  if (!token) return res.status(500).json({ error: 'No PRINTIFY_API_KEY' });

  const { fileName, contents } = req.body;
  if (!fileName || !contents) return res.status(400).json({ error: 'Missing fileName or contents' });

  try {
    const resp = await fetch('https://api.printify.com/v1/uploads/images.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GASSite/1.0'
      },
      body: JSON.stringify({ file_name: fileName, contents })
    });
    const result = await resp.json();
    if (!resp.ok) return res.status(resp.status).json(result);
    return res.status(200).json({ id: result.id, name: result.file_name });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
