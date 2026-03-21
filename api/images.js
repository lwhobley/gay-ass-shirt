// api/images.js
// Visit: https://your-vercel-url.vercel.app/api/images
// Lists all uploaded images in your Printify account with their IDs

module.exports = async function handler(req, res) {
  var token = process.env.PRINTIFY_API_KEY;

  if (!token) {
    return res.status(500).json({ error: 'PRINTIFY_API_KEY not set' });
  }

  try {
    var resp = await fetch('https://api.printify.com/v1/uploads.json?limit=50', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'GASSite/1.0'
      }
    });

    var data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data });

    // Map to just name + id for easy reading
    var images = (data.data || data).map(function(img) {
      return { name: img.file_name, id: img.id };
    });

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ total: images.length, images: images });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
