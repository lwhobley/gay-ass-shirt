// api/setup-products.js  v3 — split mode
// Step 1 - upload images:  ?secret=gas-setup-2024&step=upload
// Step 2 - create products: ?secret=gas-setup-2024&step=create&ids=PASTE_JSON_HERE
// Or run both:             ?secret=gas-setup-2024&step=all

module.exports = async function handler(req, res) {
if (req.query.secret !== ‘gas-setup-2024’) return res.status(401).end(‘Unauthorized’);

const token  = process.env.PRINTIFY_API_KEY;
const shopId = process.env.PRINTIFY_SHOP_ID;
if (!token || !shopId) return res.status(500).json({ error: ‘Missing PRINTIFY_API_KEY or PRINTIFY_SHOP_ID’ });

const step = req.query.step || ‘upload’;
const BASE = ‘https://raw.githubusercontent.com/lwhobley/gay-ass-shirt/main/designs’;

const designFiles = [
{ key: ‘rainbow_llama’,    file: ‘IMG_1832.png’  },
{ key: ‘gas_flame’,        file: ‘IMG_1850.png’  },
{ key: ‘rainbow_stripes’,  file: ‘IMG_1848.png’  },
{ key: ‘neon_sign’,        file: ‘IMG_1825.jpeg’ },
{ key: ‘yellow_purple’,    file: ‘IMG_1846.png’  },
{ key: ‘not_gay_50’,       file: ‘IMG_1853.png’  },
{ key: ‘dont_touch’,       file: ‘IMG_1822.jpeg’ },
{ key: ‘its_my_bubble’,    file: ‘IMG_1851.png’  },
{ key: ‘glitter_script’,   file: ‘IMG_1847.png’  },
{ key: ‘retro_pastel’,     file: ‘IMG_1849.png’  },
{ key: ‘retro_sunset’,     file: ‘IMG_1845.png’  },
{ key: ‘gas_stamp’,        file: ‘IMG_1823.jpeg’ },
{ key: ‘groovy_original’,  file: ‘IMG_1821.png’  },
{ key: ‘flame_tattoo’,     file: ‘IMG_1852.png’  },
{ key: ‘not_gay_shirt_is’, file: ‘IMG_1854.png’  },
{ key: ‘pastel_sticker’,   file: ‘IMG_1826.jpeg’ },
];

// ── STEP 1: Upload images ───────────────────────────────────────
if (step === ‘upload’ || step === ‘all’) {
const imageIds = {};
for (const d of designFiles) {
try {
const r = await fetch(‘https://api.printify.com/v1/uploads/images.json’, {
method: ‘POST’,
headers: {
‘Authorization’: `Bearer ${token}`,
‘Content-Type’: ‘application/json’,
‘User-Agent’: ‘GASSite/1.0’
},
body: JSON.stringify({ file_name: d.file, url: `${BASE}/${d.file}` })
});
const data = await r.json();
if (!r.ok) throw new Error(data.message || JSON.stringify(data).slice(0,200));
imageIds[d.key] = data.id;
} catch(e) {
imageIds[d.key] = `ERROR:${e.message.slice(0,100)}`;
}
}

```
if (step === 'upload') {
  return res.status(200).json({
    message: 'Images uploaded! Copy the image_ids below and call ?step=create&ids=PASTE',
    image_ids: imageIds
  });
}
// fall through to create if step=all
return createProducts(res, token, shopId, imageIds);
```

}

// ── STEP 2: Create products (pass ids as query param) ──────────
if (step === ‘create’) {
let imageIds;
try {
imageIds = JSON.parse(req.query.ids || ‘{}’);
} catch(e) {
return res.status(400).json({ error: ‘Invalid ids JSON’ });
}
return createProducts(res, token, shopId, imageIds);
}

return res.status(400).json({ error: ‘Invalid step. Use upload, create, or all’ });
};

async function createProducts(res, token, shopId, imageIds) {
const TEE  = { S:18051, M:18053, L:18054, XL:18055, “2XL”:18056 };
const POLO = { S:112158, M:112160, L:112162, XL:112164, “2XL”:112166 };

function product(title, desc, imageId, blueprintId, providerId, variants, price) {
if (!imageId || imageId.startsWith(‘ERROR’)) return null;
return {
title, description: desc,
blueprint_id: blueprintId,
print_provider_id: providerId,
variants: Object.values(variants).map(id => ({ id, price, is_enabled: true })),
print_areas: [{
variant_ids: Object.values(variants),
placeholders: [{ position: ‘front’, images: [{ id: imageId, x:0.5, y:0.5, scale:1, angle:0 }] }]
}]
};
}

const tee  = (t,d,k,p=2500) => product(t,d,imageIds[k],12,99,TEE,p);
const polo = (t,d,k,p=3500) => product(t,d,imageIds[k],1604,10,POLO,p);

const products = [
tee(‘Rainbow Llama Tee’,               ‘Gay Ass Shirt — Rainbow llama pride’,           ‘rainbow_llama’),
tee(‘G.A.S. Flame Logo Tee’,           ‘Gay Ass Shirt — GAS flame logo’,                ‘gas_flame’),
tee(‘Rainbow Pride Stripes Tee’,       ‘Gay Ass Shirt — Bold rainbow stripes’,          ‘rainbow_stripes’),
tee(“It’s My Neon Sign Tee”,           “Gay Ass Shirt — Neon sign It’s My GAS”,         ‘neon_sign’),
tee(‘Yellow Purple Bubble Tee’,        ‘Gay Ass Shirt — Yellow bubble purple outline’,  ‘yellow_purple’),
tee(“I’m Not Gay But $50 Is $50 Tee”,  “Gay Ass Shirt — Funny $50 is $50”,             ‘not_gay_50’),
tee(“Don’t Touch My GAS Shirt Tee”,    “Gay Ass Shirt — Don’t touch my gas ass shirt”, ‘dont_touch’),
tee(“It’s My Gay Ass Shirt Bubble Tee”,“Gay Ass Shirt — Bubble letters”,                ‘its_my_bubble’),
tee(‘Glitter Script Tee’,              ‘Gay Ass Shirt — Glitter script’,                ‘glitter_script’),
tee(‘Retro Pastel Tee’,                ‘Gay Ass Shirt — Retro pastel stacked’,          ‘retro_pastel’),
tee(‘Retro Sunset Pride Tee’,          ‘Gay Ass Shirt — Retro sunset Houston TX’,       ‘retro_sunset’),
tee(‘GAS Stamp Tee’,                   ‘Gay Ass Shirt — You Like My GAS Stamp’,         ‘gas_stamp’),
tee(‘Original Groovy GAS Tee’,         ‘Gay Ass Shirt — Original groovy design’,        ‘groovy_original’),
polo(“Ol’ Gay Ass Flame Polo”,         “Gay Ass Shirt — Flame tattoo polo”,             ‘flame_tattoo’),
polo(“I’m Not Gay My Shirt Is Polo”,   “Gay Ass Shirt — I’m not gay my shirt is”,      ‘not_gay_shirt_is’),
polo(“It’s My Gay Ass Pastel Polo”,    “Gay Ass Shirt — Pastel sticker polo”,           ‘pastel_sticker’),
].filter(Boolean);

const created = {};
for (const p of products) {
try {
const r = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
method: ‘POST’,
headers: {
‘Authorization’: `Bearer ${token}`,
‘Content-Type’: ‘application/json’,
‘User-Agent’: ‘GASSite/1.0’
},
body: JSON.stringify(p)
});
const data = await r.json();
if (!r.ok) throw new Error(data.message || JSON.stringify(data).slice(0,200));
created[p.title] = data.id;
} catch(e) {
created[p.title] = `ERROR:${e.message.slice(0,100)}`;
}
}

return res.status(200).json({ message: ‘Products created!’, product_ids: created });
}
