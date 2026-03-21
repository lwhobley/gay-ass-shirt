// api/setup-products.js
// Creates all G.A.S. products in Printify with correct images
// Visit: https://your-vercel-url.vercel.app/api/setup-products?secret=gas-setup-2024
// ONE TIME USE — delete after running

module.exports = async function handler(req, res) {
  if (req.query.secret !== 'gas-setup-2024') {
    return res.status(401).json({ error: 'Add ?secret=gas-setup-2024' });
  }

  var token  = process.env.PRINTIFY_API_KEY;
  var shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) return res.status(500).json({ error: 'Missing env vars' });

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');

  function log(msg) { res.write(msg + '\n'); }

  // ── Image IDs from upload ──────────────────────────────────────────
  var IMAGES = {
    "01_White_Box_Tee":                    "69be67266da184d3051fe1c3",
    "02_Green_Box_Tee":                    "69be6727bb3793b44646289f",
    "03_Grey_Heather_Collegiate_Tee":      "69be6728460b35b527827e49",
    "04_Gold_Collegiate_Tee":              "69be6728460b35b527827e49",
    "05_Lavender_Script_Tee":              "69be672a6da184d3051fe1c4",
    "06_Black_Script_Tee":                 "69be672a6da184d3051fe1c4",
    "07_Teal_Minimal_Tee":                 "69be672cfac1eb3b54de65a7",
    "08_Navy_Retro_Bubble_Tee":            "69be672d84c3ac5227f500f0",
    "09_Coral_Retro_Bubble_Tee":           "69be672e2000b9faf066a636",
    "10_Pink_Pocket_Script_Tee":           "69be6730db56948a9c4dd543",
    "11_Lavender_Retro_Bubble_Tee_FRONT":  "69be67308a81420bf417b499",
    "12_Lavender_Retro_Bubble_Tee_BACK":   "69be6732b80ae7ae770a8a66",
    "13_Teal_Rainbow_Bold_Tee_FRONT":      "69be673230b87809ed441a77",
    "14_Teal_Rainbow_Bold_Tee_BACK":       "69be673430b87809ed441a78",
    "15_Natural_Sparkle_Script_Tee_FRONT": "69be6735fac1eb3b54de65a9",
    "16_Natural_Sparkle_Script_Tee_BACK":  "69be67368a81420bf417b49b",
    "17_Lime_Yellow_Block_Tee_FRONT":      "69be67376da184d3051fe1c6",
    "18_Lime_Yellow_Block_Tee_BACK":       "69be6738fdf07e9f4ed49f6a",
    "19_Black_Graffiti_Tee_FRONT":         "69be6739fdf07e9f4ed49f6b",
    "20_Black_Graffiti_Tee_BACK":          "69be673b460b35b527827e4a",
    "21_Gold_Collegiate_Polo":             "69be673ce81774a207ad13ba",
    "22_Navy_Script_Polo":                 "69be673c2000b9faf066a637",
    "23_Lavender_Script_Polo":             "69be673dac1f9eae3cbb7c4a",
    "24_Black_Pride_Retro_Polo":           "69be673ebb3793b4464628a4",
    "25_Navy_PanPride_Polo":               "69be673dac1f9eae3cbb7c4a",
    "26_Purple_Mardi_Gras_Script_Polo":    "69be673f460b35b527827e4b",
    "27_Purple_Mardi_Gras_AllOver_Polo":   "69be673fbb3793b4464628a5",
    "28_Green_Christmas_Polo":             "69be6740460b35b527827e4c",
    "29_Pink_Valentines_Polo":             "69be674184c3ac5227f500f4",
    "30_Black_Halloween_Polo":             "69be6742460b35b527827e4d",
    "31_Red_Dragon_Polo":                  "69be674276d635f71e2e469f"
  };

  // ── Helper: GET Printify ───────────────────────────────────────────
  async function pGet(path) {
    var r = await fetch('https://api.printify.com/v1' + path, {
      headers: { 'Authorization': 'Bearer ' + token, 'User-Agent': 'GASSite/1.0' }
    });
    return r.json();
  }

  // ── Helper: POST Printify ──────────────────────────────────────────
  async function pPost(path, body) {
    var r = await fetch('https://api.printify.com/v1' + path, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'User-Agent': 'GASSite/1.0'
      },
      body: JSON.stringify(body)
    });
    return r.json();
  }

  // ── Helper: get first print provider + its variants for a blueprint ─
  async function getProviderAndVariants(blueprintId) {
    var providers = await pGet('/catalog/blueprints/' + blueprintId + '/print_providers.json');
    var provider  = providers[0];
    var variants  = await pGet('/catalog/blueprints/' + blueprintId + '/print_providers/' + provider.id + '/variants.json');
    return { providerId: provider.id, variants: variants.variants || variants };
  }

  // ── Helper: build image placeholder ───────────────────────────────
  function placeholder(position, imageId) {
    return {
      position: position,
      images: [{ id: imageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }]
    };
  }

  // ── Helper: create one product ─────────────────────────────────────
  async function createProduct(name, blueprintId, providerId, variantIds, printAreas) {
    var variants = variantIds.map(function(id) { return { id: id, price: 2500 }; });
    var payload = {
      title: name,
      description: 'G.A.S. — Gay Ass Shirts. For everyone who was ever put in a box.',
      blueprint_id: blueprintId,
      print_provider_id: providerId,
      variants: variants,
      print_areas: printAreas
    };
    return pPost('/shops/' + shopId + '/products.json', payload);
  }

  log('G.A.S. Product Setup Starting...\n');

  var results = {};

  try {
    // ── Step 1: Get tee blueprint info (Blueprint 12 — Bella+Canvas 3001) ──
    log('Fetching tee blueprint info (Bella+Canvas 3001)...');
    var tee = await getProviderAndVariants(12);
    log('Tee provider: ' + tee.providerId + ', variants: ' + tee.variants.length);

    // Get S/M/L/XL/2XL variant IDs — filter for standard unisex sizes
    var sizeMap = { 'S': null, 'M': null, 'L': null, 'XL': null, '2XL': null };
    tee.variants.forEach(function(v) {
      var title = (v.title || '');
      Object.keys(sizeMap).forEach(function(size) {
        if (title.includes(size) && !sizeMap[size]) sizeMap[size] = v.id;
      });
    });
    var teeVariantIds = Object.values(sizeMap).filter(Boolean);
    log('Tee variant IDs: ' + JSON.stringify(sizeMap) + '\n');

    // ── Step 2: Get polo blueprint info (Blueprint 1604 — AOP Polo) ──
    log('Fetching polo blueprint info (AOP Polo 1604)...');
    var polo = await getProviderAndVariants(1604);
    log('Polo provider: ' + polo.providerId + ', variants: ' + polo.variants.length);

    var poloSizeMap = { 'S': null, 'M': null, 'L': null, 'XL': null, '2XL': null };
    polo.variants.forEach(function(v) {
      var title = (v.title || '');
      Object.keys(poloSizeMap).forEach(function(size) {
        if (title.includes(size) && !poloSizeMap[size]) poloSizeMap[size] = v.id;
      });
    });
    var poloVariantIds = Object.values(poloSizeMap).filter(Boolean);
    log('Polo variant IDs: ' + JSON.stringify(poloSizeMap) + '\n');

    // ── Step 3: Define all products ────────────────────────────────
    var products = [
      // Single-side tees
      { name: 'White Box Tee',              type: 'tee',  front: IMAGES['01_White_Box_Tee'] },
      { name: 'Green Box Tee',              type: 'tee',  front: IMAGES['02_Green_Box_Tee'] },
      { name: 'Grey Heather Collegiate Tee',type: 'tee',  front: IMAGES['03_Grey_Heather_Collegiate_Tee'] },
      { name: 'Gold Collegiate Tee',        type: 'tee',  front: IMAGES['04_Gold_Collegiate_Tee'] },
      { name: 'Lavender Script Tee',        type: 'tee',  front: IMAGES['05_Lavender_Script_Tee'] },
      { name: 'Black Script Tee',           type: 'tee',  front: IMAGES['06_Black_Script_Tee'] },
      { name: 'Teal Minimal Tee',           type: 'tee',  front: IMAGES['07_Teal_Minimal_Tee'] },
      { name: 'Navy Retro Bubble Tee',      type: 'tee',  front: IMAGES['08_Navy_Retro_Bubble_Tee'] },
      { name: 'Coral Retro Bubble Tee',     type: 'tee',  front: IMAGES['09_Coral_Retro_Bubble_Tee'] },
      { name: 'Pink Pocket Script Tee',     type: 'tee',  front: IMAGES['10_Pink_Pocket_Script_Tee'] },
      // Front+back tees
      { name: 'Lavender Retro Bubble Tee',  type: 'tee',  front: IMAGES['11_Lavender_Retro_Bubble_Tee_FRONT'],  back: IMAGES['12_Lavender_Retro_Bubble_Tee_BACK'] },
      { name: 'Teal Rainbow Bold Tee',      type: 'tee',  front: IMAGES['13_Teal_Rainbow_Bold_Tee_FRONT'],       back: IMAGES['14_Teal_Rainbow_Bold_Tee_BACK'] },
      { name: 'Natural Sparkle Script Tee', type: 'tee',  front: IMAGES['15_Natural_Sparkle_Script_Tee_FRONT'],  back: IMAGES['16_Natural_Sparkle_Script_Tee_BACK'] },
      { name: 'Lime Yellow Block Tee',      type: 'tee',  front: IMAGES['17_Lime_Yellow_Block_Tee_FRONT'],       back: IMAGES['18_Lime_Yellow_Block_Tee_BACK'] },
      { name: 'Black Graffiti Tee',         type: 'tee',  front: IMAGES['19_Black_Graffiti_Tee_FRONT'],          back: IMAGES['20_Black_Graffiti_Tee_BACK'] },
      // Polos
      { name: 'Gold Collegiate Polo',       type: 'polo', front: IMAGES['21_Gold_Collegiate_Polo'] },
      { name: 'Navy Script Polo',           type: 'polo', front: IMAGES['22_Navy_Script_Polo'] },
      { name: 'Lavender Script Polo',       type: 'polo', front: IMAGES['23_Lavender_Script_Polo'] },
      { name: 'Black Pride Retro Polo',     type: 'polo', front: IMAGES['24_Black_Pride_Retro_Polo'] },
      { name: 'Navy PanPride Polo',         type: 'polo', front: IMAGES['25_Navy_PanPride_Polo'] },
      { name: 'Purple Mardi Gras Polo',     type: 'polo', front: IMAGES['26_Purple_Mardi_Gras_Script_Polo'] },
      { name: 'Purple Mardi Gras AllOver',  type: 'polo', front: IMAGES['27_Purple_Mardi_Gras_AllOver_Polo'] },
      { name: 'Green Christmas Polo',       type: 'polo', front: IMAGES['28_Green_Christmas_Polo'] },
      { name: 'Pink Valentines Polo',       type: 'polo', front: IMAGES['29_Pink_Valentines_Polo'] },
      { name: 'Black Halloween Polo',       type: 'polo', front: IMAGES['30_Black_Halloween_Polo'] },
      { name: 'Red Dragon Polo',            type: 'polo', front: IMAGES['31_Red_Dragon_Polo'] },
    ];

    // ── Step 4: Create each product ────────────────────────────────
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var isTee = p.type === 'tee';
      var bpId  = isTee ? 12 : 1604;
      var prvId = isTee ? tee.providerId : polo.providerId;
      var vIds  = isTee ? teeVariantIds : poloVariantIds;

      // Build print areas
      var placeholders = [placeholder('front', p.front)];
      if (p.back) placeholders.push(placeholder('back', p.back));

      var printAreas = [{
        variant_ids: vIds,
        placeholders: placeholders
      }];

      log('(' + (i+1) + '/' + products.length + ') Creating: ' + p.name + '...');
      var result = await pPost('/shops/' + shopId + '/products.json', {
        title: p.name,
        description: 'G.A.S. — Gay Ass Shirts. For everyone who was ever put in a box.',
        blueprint_id: bpId,
        print_provider_id: prvId,
        variants: vIds.map(function(id) { return { id: id, price: isTee ? 2500 : 4000 }; }),
        print_areas: printAreas
      });

      if (result.id) {
        results[p.name] = result.id;
        log('  ✓ Created → product ID: ' + result.id);
      } else {
        log('  ✗ Failed: ' + JSON.stringify(result).slice(0, 200));
      }

      await new Promise(function(r) { setTimeout(r, 500); });
    }

    log('\n=== ALL DONE ===');
    log('Product IDs (save these for webhook.js):');
    log(JSON.stringify(results, null, 2));
    res.end();

  } catch (err) {
    log('ERROR: ' + err.message);
    res.end();
  }
};
