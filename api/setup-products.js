module.exports = async function(req, res) {
if (req.query.secret !== ‘gas-setup-2024’) return res.status(401).end(‘Unauthorized’);
const token = process.env.PRINTIFY_API_KEY;
const shop = process.env.PRINTIFY_SHOP_ID;
if (!token || !shop) return res.status(500).json({ error: ‘Missing env vars’ });

var BASE = ‘https://raw.githubusercontent.com/lwhobley/gay-ass-shirt/main/designs/’;
var files = [
[‘rainbow_llama’,‘IMG_1832.png’],[‘gas_flame’,‘IMG_1850.png’],
[‘rainbow_stripes’,‘IMG_1848.png’],[‘neon_sign’,‘IMG_1825.jpeg’],
[‘yellow_purple’,‘IMG_1846.png’],[‘not_gay_50’,‘IMG_1853.png’],
[‘dont_touch’,‘IMG_1822.jpeg’],[‘its_my_bubble’,‘IMG_1851.png’],
[‘glitter_script’,‘IMG_1847.png’],[‘retro_pastel’,‘IMG_1849.png’],
[‘retro_sunset’,‘IMG_1845.png’],[‘gas_stamp’,‘IMG_1823.jpeg’],
[‘groovy_original’,‘IMG_1821.png’],[‘flame_tattoo’,‘IMG_1852.png’],
[‘not_gay_shirt_is’,‘IMG_1854.png’],[‘pastel_sticker’,‘IMG_1826.jpeg’]
];
var titles = {
rainbow_llama:‘Rainbow Llama Tee’,gas_flame:‘GAS Flame Logo Tee’,
rainbow_stripes:‘Rainbow Stripes Tee’,neon_sign:“It’s My Neon Sign Tee”,
yellow_purple:‘Yellow Purple Bubble Tee’,not_gay_50:“Not Gay But $50 Is $50 Tee”,
dont_touch:“Don’t Touch My GAS Tee”,its_my_bubble:“It’s My GAS Bubble Tee”,
glitter_script:‘Glitter Script Tee’,retro_pastel:‘Retro Pastel Tee’,
retro_sunset:‘Retro Sunset Pride Tee’,gas_stamp:‘GAS Stamp Tee’,
groovy_original:‘Original Groovy GAS Tee’,flame_tattoo:“Ol Gay Ass Flame Polo”,
not_gay_shirt_is:“Not Gay My Shirt Is Polo”,pastel_sticker:“Gay Ass Pastel Polo”
};
var polos = [‘flame_tattoo’,‘not_gay_shirt_is’,‘pastel_sticker’];
var h = {‘Authorization’:’Bearer ’+token,‘Content-Type’:‘application/json’,‘User-Agent’:‘GASSite/1.0’};
var imgIds = {};
var products = {};

for (var i = 0; i < files.length; i++) {
var key = files[i][0];
var file = files[i][1];
try {
var r = await fetch(‘https://api.printify.com/v1/uploads/images.json’,{method:‘POST’,headers:h,body:JSON.stringify({file_name:file,url:BASE+file})});
var d = await r.json();
imgIds[key] = r.ok ? d.id : ‘ERR:’+(d.message||’’).slice(0,60);
} catch(e) { imgIds[key] = ‘ERR:’+e.message.slice(0,60); }
}

for (var i = 0; i < files.length; i++) {
var key = files[i][0];
if (!imgIds[key] || imgIds[key].indexOf(‘ERR’) === 0) continue;
var isPolo = polos.indexOf(key) >= 0;
var variants = isPolo ? [112158,112160,112162,112164,112166] : [18051,18053,18054,18055,18056];
try {
var r = await fetch(‘https://api.printify.com/v1/shops/’+shop+’/products.json’,{method:‘POST’,headers:h,body:JSON.stringify({
title:titles[key],description:‘Gay Ass Shirt’,
blueprint_id:isPolo?1604:12,print_provider_id:isPolo?10:99,
variants:variants.map(function(id){return{id:id,price:isPolo?3500:2500,is_enabled:true}}),
print_areas:[{variant_ids:variants,placeholders:[{position:‘front’,images:[{id:imgIds[key],x:0.5,y:0.5,scale:1,angle:0}]}]}]
})});
var d = await r.json();
products[titles[key]] = r.ok ? d.id : ‘ERR:’+(d.message||’’).slice(0,60);
} catch(e) { products[titles[key]] = ‘ERR:’+e.message.slice(0,60); }
}

return res.status(200).json({image_ids:imgIds,product_ids:products});
};
