// api/catalog.js — search by ?q=polo or ?q=tee
module.exports = async function handler(req, res) {
  var token = process.env.PRINTIFY_API_KEY;
  if (!token) return res.status(500).json({ error: 'PRINTIFY_API_KEY not set' });

  var q = (req.query.q || 'tee').toLowerCase();

  try {
    var resp = await fetch('https://api.printify.com/v1/catalog/blueprints.json', {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'GASSite/1.0' }
    });
    var data = await resp.json();

    var filtered = data
      .filter(function(b) { return (b.title || '').toLowerCase().includes(q); })
      .map(function(b) { return { id: b.id, title: b.title, brand: b.brand, model: b.model }; });

    return res.status(200).json({ query: q, total: filtered.length, blueprints: filtered });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
