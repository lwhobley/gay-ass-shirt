// api/shops.js
// Visit: https://your-vercel-url.vercel.app/api/shops
// Returns your Printify shop ID and store info

module.exports = async function handler(req, res) {
  var token = process.env.PRINTIFY_API_KEY;

  if (!token) {
    return res.status(500).json({ error: 'PRINTIFY_API_KEY env var not set in Vercel' });
  }

  try {
    var resp = await fetch('https://api.printify.com/v1/shops.json', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'User-Agent': 'GASSite/1.0'
      }
    });

    var data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data });
    }

    // Return nicely formatted so it's easy to read in browser
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      message: 'Your Printify shops — copy the id you want to use as PRINTIFY_SHOP_ID',
      shops: data
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
