 api/setup-products.js  — v2 with 16 new designs
// Run once: https://gay-ass-shirt.vercel.app/api/setup-products?secret=gas-setup-2024

module.exports = async function handler(req, res) {
  if (req.query.secret !== 'gas-setup-2024') return res.status(401).end('Unauthorized');

  const token  = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) return res.status(500).json({ error: 'Missing env vars' });

  const BASE = 'https://raw.githubusercontent.com/lwhobley/gay-ass-shirt/main/designs';

  // Step 1: Upload all 16 images to Printify
  const designFiles = [
    { key: 'rainbow_llama',       file: 'IMG_1832.png',  name: 'Rainbow Llama GAS' },
    { key: 'gas_flame',           file: 'IMG_1850.png',  name: 'GAS Flame Logo' },
    { key: 'rainbow_stripes',     file: 'IMG_1848.png',  name: 'Rainbow Stripes GAY ASS SHIRT' },
    { key: 'neon_sign',           file: 'IMG_1825.jpeg', name: "Neon Sign It's My" },
    { key: 'yellow_purple',       file: 'IMG_1846.png',  name: 'Yellow Purple Bubble' },
    { key: 'not_gay_50',          file: 'IMG_1853.png',  name: "I'm Not Gay But $50 Is $50" },
    { key: 'dont_touch',          file: 'IMG_1822.jpeg', name: "Don't Touch My GAS Shirt" },
    { key: 'its_my_bubble',       file: 'IMG_1851.png',  name: "It's My Gay Ass Shirt Bubble" },
    { key: 'glitter_script',      file: 'IMG_1847.png',  name: 'Glitter Script GAY ASS SHIRT' },
    { key: 'retro_pastel',        file: 'IMG_1849.png',  name: 'Retro Pastel Stacked' },
    { key: 'retro_sunset',        file: 'IMG_1845.png',  name: 'Retro Sunset Pride Houston' },
    { key: 'gas_stamp',           file: 'IMG_1823.jpeg', name: 'You Like My GAS Stamp' },
    { key: 'groovy_original',     file: 'IMG_1821.png',  name: 'Original Groovy GAS' },
    { key: 'flame_tattoo',        file: "IMG_1852.png",  name: "Ol' Gay Ass Shirt Flame" },
    { key: 'not_gay_shirt_is',    file: 'IMG_1854.png',  name: "I'm Not Gay But My Shirt Is" },
    { key: 'pastel_sticker',      file: 'IMG_1826.jpeg', name: "It's My Gay Ass Shirt Pastel" },
  ];

  console.log('=== Uploading images to Printify ===');
  const imageIds = {};

  for (const d of designFiles) {
    try {
      const r = await fetch('https://api.printify.com/v1/uploads/images.json', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'GASSite/1.0' },
        body: JSON.stringify({ file_name: d.file, url: `${BASE}/${d.file}` })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || JSON.stringify(data));
      imageIds[d.key] = data.id;
      console.log(`✓ ${d.name}: ${data.id}`);
    } catch(e) {
      console.error(`✗ ${d.name}: ${e.message}`);
      imageIds[d.key] = null;
    }
  }

  // Blueprint + variant IDs (from previous setup)
  // Tees: Blueprint 12 — Bella+Canvas 3001, Provider 99
  // Polos: Blueprint 1604 — AOP Polo, Provider 10
  const TEE_VARIANTS  = { S:18051, M:18053, L:18054, XL:18055, "2XL":18056 };
  const POLO_VARIANTS = { S:112158, M:112160, L:112162, XL:112164, "2XL":112166 };

  function teeProduct(title, description, imageId, price=2500) {
    if (!imageId) return null;
    return {
      title,
      description,
      blueprint_id: 12,
      print_provider_id: 99,
      variants: Object.entries(TEE_VARIANTS).map(([label, id]) => ({
        id, price, is_enabled: true
      })),
      print_areas: [{
        variant_ids: Object.values(TEE_VARIANTS),
        placeholders: [{ position: 'front', images: [{ id: imageId, x:0.5, y:0.5, scale:1, angle:0 }] }]
      }]
    };
  }

  function poloProduct(title, description, imageId, price=3500) {
    if (!imageId) return null;
    return {
      title,
      description,
      blueprint_id: 1604,
      print_provider_id: 10,
      variants: Object.entries(POLO_VARIANTS).map(([label, id]) => ({
        id, price, is_enabled: true
      })),
      print_areas: [{
        variant_ids: Object.values(POLO_VARIANTS),
        placeholders: [{ position: 'front', images: [{ id: imageId, x:0.5, y:0.5, scale:1, angle:0 }] }]
      }]
    };
  }

  // Step 2: Create all products
  const products = [
    teeProduct('Rainbow Llama Tee',              'Gay Ass Shirt — Rainbow Llama pride design',         imageIds.rainbow_llama),
    teeProduct('G.A.S. Flame Logo Tee',          'Gay Ass Shirt — GAS flame logo design',              imageIds.gas_flame),
    teeProduct('Rainbow Stripes Tee',            'Gay Ass Shirt — Bold rainbow pride stripes',         imageIds.rainbow_stripes),
    teeProduct("It's My Neon Sign Tee",          "Gay Ass Shirt — Neon sign It's My Gay Ass Shirt",   imageIds.neon_sign),
    teeProduct('Yellow Purple Bubble Tee',       'Gay Ass Shirt — Yellow bubble purple outline',       imageIds.yellow_purple),
    teeProduct("I'm Not Gay But $50 Is $50 Tee", "Gay Ass Shirt — Funny I'm not gay but $50 is $50",  imageIds.not_gay_50),
    teeProduct("Don't Touch My GAS Shirt Tee",   "Gay Ass Shirt — Don't touch my gas ass shirt",      imageIds.dont_touch),
    teeProduct("It's My Gay Ass Shirt Bubble Tee","Gay Ass Shirt — Bubble letter It's My Gay Ass",    imageIds.its_my_bubble),
    teeProduct('Glitter Script Tee',             'Gay Ass Shirt — Glitter script design',              imageIds.glitter_script),
    teeProduct('Retro Pastel Tee',               'Gay Ass Shirt — Retro pastel stacked letters',       imageIds.retro_pastel),
    teeProduct('Retro Sunset Pride Tee',         'Gay Ass Shirt — Retro sunset pride Houston TX',      imageIds.retro_sunset),
    teeProduct('GAS Stamp Tee',                  'Gay Ass Shirt — You Like My Gas Ass Shirt stamp',    imageIds.gas_stamp),
    teeProduct('Original Groovy Tee',            'Gay Ass Shirt — Original groovy GAS design',         imageIds.groovy_original),
    poloProduct("Ol' Gay Ass Shirt Flame Polo",  "Gay Ass Shirt — Ol' Gay Ass Shirt flame tattoo",    imageIds.flame_tattoo),
    poloProduct("I'm Not Gay My Shirt Is Polo",  "Gay Ass Shirt — I'm Not Gay But My Shirt Is",       imageIds.not_gay_shirt_is),
    poloProduct("It's My Gay Ass Pastel Polo",   "Gay Ass Shirt — It's My Gay Ass Shirt pastel",      imageIds.pastel_sticker),
  ].filter(Boolean);

  console.log(`\n=== Creating ${products.length} products ===`);
  const created = {};

  for (const product of products) {
    try {
      const r = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'GASSite/1.0' },
        body: JSON.stringify(product)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || JSON.stringify(data));
      created[product.title] = data.id;
      console.log(`✓ ${product.title}: ${data.id}`);
    } catch(e) {
      console.error(`✗ ${product.title}: ${e.message}`);
      created[product.title] = 'ERROR';
    }
  }

  return res.status(200).json({
    message: 'Setup complete!',
    image_ids: imageIds,
    product_ids: created
  });
};
