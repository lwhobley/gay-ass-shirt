module.exports = async function(req, res) {
  if (req.query.secret !== "gas-setup-2024") return res.status(401).end("Unauthorized");
  var token = process.env.PRINTIFY_API_KEY;
  var shop = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shop) return res.status(500).json({ error: "Missing env vars" });
  var BASE = "https://raw.githubusercontent.com/lwhobley/gay-ass-shirt/main/designs/";
  var h = { "Authorization": "Bearer " + token, "Content-Type": "application/json", "User-Agent": "GASSite/1.0" };
  var batch = req.query.batch || "1";
  var files = batch === "1" ? [
    ["rainbow_llama","IMG_1832.png","Rainbow Llama Tee",false],
    ["gas_flame","IMG_1850.png","GAS Flame Logo Tee",false],
    ["rainbow_stripes","IMG_1848.png","Rainbow Stripes Tee",false],
    ["neon_sign","IMG_1825.png","Neon Sign Tee",false],
    ["yellow_purple","IMG_1846.png","Yellow Purple Bubble Tee",false],
    ["not_gay_50","IMG_1853.png","Not Gay But 50 Is 50 Tee",false],
    ["dont_touch","IMG_1822.png","Dont Touch My GAS Tee",false],
    ["its_my_bubble","IMG_1851.png","Its My GAS Bubble Tee",false]
  ] : [
    ["glitter_script","IMG_1847.png","Glitter Script Tee",false],
    ["retro_pastel","IMG_1849.png","Retro Pastel Tee",false],
    ["retro_sunset","IMG_1845.png","Retro Sunset Pride Tee",false],
    ["gas_stamp","IMG_1823.png","GAS Stamp Tee",false],
    ["groovy_original","IMG_1821.png","Original Groovy GAS Tee",false],
    ["flame_tattoo","IMG_1852.png","Ol Gay Ass Flame Polo",true],
    ["not_gay_shirt_is","IMG_1854.png","Not Gay My Shirt Is Polo",true],
    ["pastel_sticker","IMG_1826.png","Gay Ass Pastel Polo",true]
  ];
  var imgIds = {};
  var products = {};
  for (var i = 0; i < files.length; i++) {
    var key = files[i][0]; var file = files[i][1];
    try {
      var r1 = await fetch("https://api.printify.com/v1/uploads/images.json", { method: "POST", headers: h, body: JSON.stringify({ file_name: file, url: BASE + file }) });
      var d1 = await r1.json();
      imgIds[key] = r1.ok ? d1.id : "ERR:" + String(d1.message || "").slice(0, 80);
    } catch(e1) { imgIds[key] = "ERR:" + String(e1.message).slice(0, 80); }
  }
  for (var j = 0; j < files.length; j++) {
    var key = files[j][0]; var title = files[j][2]; var isPolo = files[j][3];
    if (!imgIds[key] || imgIds[key].indexOf("ERR") === 0) { products[title] = "SKIP:" + imgIds[key]; continue; }
    var vids = isPolo ? [112158,112160,112162,112164,112166] : [18051,18053,18054,18055,18056];
    var price = isPolo ? 3500 : 2500;
    var bp = isPolo ? 1604 : 12;
    var pp = isPolo ? 10 : 29;
    try {
      var r2 = await fetch("https://api.printify.com/v1/shops/" + shop + "/products.json", { method: "POST", headers: h, body: JSON.stringify({ title: title, description: "Gay Ass Shirt", blueprint_id: bp, print_provider_id: pp, variants: vids.map(function(id) { return { id: id, price: price, is_enabled: true }; }), print_areas: [{ variant_ids: vids, placeholders: [{ position: "front", images: [{ id: imgIds[key], x: 0.5, y: 0.5, scale: 1, angle: 0 }] }] }] }) });
      var d2 = await r2.json();
      products[title] = r2.ok ? d2.id : "ERR:" + String(d2.message || "").slice(0, 80);
    } catch(e2) { products[title] = "ERR:" + String(e2.message).slice(0, 80); }
  }
  return res.status(200).json({ batch: batch, image_ids: imgIds, product_ids: products });
};
