// api/upload-designs.js
// ONE-TIME USE endpoint — uploads all 31 designs to Printify
// Visit: https://your-vercel-url.vercel.app/api/upload-designs
// Delete this file after use!

const DESIGNS = require('./designs.js');

const TOKEN   = process.env.PRINTIFY_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6IjA5M2I5MTY2ODZiNzAxNzQ0MTVlYmY2NGYxZmVjYTQ5MTRhN2U0ZTMyMWY0MjcwMmQwNzAyMjQ2NzVhNGJjODQ5ZmIzMDYwMjZjYmIxZGFlIiwiaWF0IjoxNzc0MDQwNjQ1Ljg1MjI5LCJuYmYiOjE3NzQwNDA2NDUuODUyMjkyLCJleHAiOjE4MDU1NzY2NDUuODQzNDI0LCJzdWIiOiIyNjcwNzg1NCIsInNjb3BlcyI6WyJzaG9wcy5tYW5hZ2UiLCJzaG9wcy5yZWFkIiwiY2F0YWxvZy5yZWFkIiwib3JkZXJzLnJlYWQiLCJvcmRlcnMud3JpdGUiLCJwcm9kdWN0cy5yZWFkIiwicHJvZHVjdHMud3JpdGUiLCJ3ZWJob29rcy5yZWFkIiwid2ViaG9va3Mud3JpdGUiLCJ1cGxvYWRzLnJlYWQiLCJ1cGxvYWRzLndyaXRlIiwicHJpbnRfcHJvdmlkZXJzLnJlYWQiLCJ1c2VyLmluZm8iXX0.KjUut3-GLL_bwZY-XbxhCcI5jawupwIe45bb-IZ-wddCHpgxJx-lW2c2qhqgo6Qw5pB6O_qwICg938J2e9l4wuri0eO7wS7TviH5z6WrIL67R5bjQynatxSXaS-jBNFVWnet8YZi-KXPdm80JpTds8lifsda6tvCpQ8xXBpHPmGcH82AQLQ_bd0bD-uf9u2iMd8XgmH1wVYUNaiSplEta0YmUGpegyn-YcCJw0N3xFG7z_reT1h11xyhyMTg7A5EBkobq983yy33rh3OGgzBzFCgN9SwIS5NA9n6-kjKypT-SsSSsJNfs4iW-iQgjgaVYDmQ6TYkPLCx9RUAC3n1-VIAPq3KE2KeVTaGCF0NRLt-qegnRW2yNJJHS8rh1j0YZ3SyblnHwjkN1ZIyWzJDuXx44aVM0QuhA16I3mDD7IOPmNU4gstaBJlDJHlYdzKymXIKXgxs69OY1YHAZ5hQ5kMMFTe9RgR7w1YPr2lIWXgXMXqKjULVulEJhhp3lEKZg_FRe3Bdt4EGN9dEmNJpBxuAM2mLsJ0ERP3BOK-FgiCoazYPaO14VzQZthLkFMqf_OrFdjGTmKQ6b5h5L_t_pQ6fnJG6OrXQb5IIpk9dunfgYVjaq3lXSMBkyBBhJD92ugmOewdiv99apuqxrXwy05LR9TfAknT-R-7fMJFkcag';
const BASE    = 'https://api.printify.com/v1';

module.exports = async function handler(req, res) {
  // Security: only allow GET with secret param
  const secret = req.query.secret;
  if (secret !== 'gas-upload-2024') {
    return res.status(401).json({ error: 'Unauthorized. Add ?secret=gas-upload-2024 to URL' });
  }

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  const results = {};
  const names   = Object.keys(DESIGNS);

  res.write('G.A.S. Printify Bulk Upload Starting...\n');
  res.write('Total images: ' + names.length + '\n\n');

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    res.write('(' + (i+1) + '/' + names.length + ') Uploading ' + name + '...');

    try {
      const resp = await fetch(BASE + '/uploads/images.json', {
        method:  'POST',
        headers: {
          'Authorization': 'Bearer ' + TOKEN,
          'Content-Type':  'application/json',
          'User-Agent':    'GASSite/1.0'
        },
        body: JSON.stringify({
          file_name: name + '.png',
          contents:  DESIGNS[name]
        })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.message || JSON.stringify(data));

      results[name] = data.id;
      res.write(' OK -> ' + data.id + '\n');
    } catch(e) {
      res.write(' FAILED: ' + e.message + '\n');
      results[name] = null;
    }

    // Brief pause between uploads
    await new Promise(r => setTimeout(r, 300));
  }

  res.write('\n=== UPLOAD COMPLETE ===\n');
  res.write('Copy the JSON below and save it — these are your Printify image IDs:\n\n');
  res.write(JSON.stringify(results, null, 2));
  res.write('\n\n=== DONE. Delete api/upload-designs.js from your repo now! ===\n');
  res.end();
};
