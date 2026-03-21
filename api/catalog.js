// api/catalog.js
// Finds the most popular t-shirt and polo blueprints with their print providers
// Visit: https://your-vercel-url.vercel.app/api/catalog

module.exports = async function handler(req, res) {
  var token = process.env.PRINTIFY_API_KEY;
  if (!token) return res.status(500).json({ error: 'PRINTIFY_API_KEY not set' });

  try {
    // Fetch all blueprints
    var resp = await fetch('https://api.printify.com/v1/catalog/blueprints.json', {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'GASSite/1.0' }
    });
    var data = await resp.json();

    // Filter to just tees and polos
    var keywords = ['unisex', 't-shirt', 'tee', 'polo', 'jersey'];
    var filtered = data.filter(function(b) {
      var title = (b.title || '').toLowerCase();
      return keywords.some(function(k) { return title.includes(k); });
    }).map(function(b) {
      return { id: b.id, title: b.title, brand: b.brand, model: b.model };
    }).slice(0, 60);

    return res.status(200).json({ total: filtered.length, blueprints: filtered });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
