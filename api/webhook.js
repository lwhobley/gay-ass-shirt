const Stripe = require("stripe");

const PRODUCTS = {
  "Rainbow Llama Tee":        { id: "69c0119f00a04ffba606fd14", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "GAS Flame Logo Tee":       { id: "69c011a400a04ffba606fd15", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Rainbow Stripes Tee":      { id: "69c011a9bacaa499b7050f9d", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Neon Sign Tee":            { id: "69c011aff5cbf780aa04663f", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Yellow Purple Bubble Tee": { id: "69c011b66279e9165e0dcb0c", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Not Gay But 50 Is 50 Tee": { id: "69c011bba44a9fea86084e72", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Dont Touch My GAS Tee":    { id: "69c011bfcb7711ff6e0a20e4", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Its My GAS Bubble Tee":    { id: "69c011c447c38225cd091445", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Glitter Script Tee":       { id: "69c012224a73470385046028", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Retro Pastel Tee":         { id: "69c0122a77c22d11f40f232f", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Retro Sunset Pride Tee":   { id: "69c01232bacaa499b7050fbb", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "GAS Stamp Tee":            { id: "69c0123652a18016220248bb", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Original Groovy GAS Tee":  { id: "69c0123b47c38225cd091464", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Ol Gay Ass Flame Polo":    { id: "69c01241e5021ddd5a0b3986", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Not Gay My Shirt Is Polo": { id: "69c0124274db54a45c0fbe89", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Gay Ass Pastel Polo":      { id: "69c0124630d65d0d260b98d5", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 }
};

async function createPrintifyOrder(session) {
  var token = process.env.PRINTIFY_API_KEY;
  var shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) { console.error("Missing Printify env vars"); return; }
  var shipping = session.shipping_details;
  var customer = session.customer_details;
  var productName = (session.metadata && session.metadata.productName) || "";
  var size = (session.metadata && session.metadata.size) || "M";
  size = size.toUpperCase().replace("XXL", "2XL");
  var product = PRODUCTS[productName];
  if (!product) { console.warn("No product found for:", productName); return; }
  var variantId = product[size] || product["M"];
  var fullName = (shipping && shipping.name) || (customer && customer.name) || "";
  var parts = fullName.trim().split(" ");
  var addr = (shipping && shipping.address) || {};
  var payload = {
    external_id: session.id,
    label: productName + " / " + size,
    line_items: [{ product_id: product.id, variant_id: variantId, quantity: 1 }],
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: {
      first_name: parts[0] || "",
      last_name: parts.slice(1).join(" ") || "",
      email: (customer && customer.email) || "",
      phone: (customer && customer.phone) || "",
      country: addr.country || "US",
      region: addr.state || "",
      address1: addr.line1 || "",
      address2: addr.line2 || "",
      city: addr.city || "",
      zip: addr.postal_code || ""
    }
  };
  console.log("Placing Printify order:", JSON.stringify(payload));
  var resp = await fetch("https://api.printify.com/v1/shops/" + shopId + "/orders.json", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json", "User-Agent": "GASSite/1.0" },
    body: JSON.stringify(payload)
  });
  var result = await resp.json();
  if (!resp.ok) { console.error("Printify order failed:", JSON.stringify(result)); throw new Error(result.message || "Printify error"); }
  console.log("Printify order placed:", result.id);
  return result;
}

function getRaw(req) {
  return new Promise(function(resolve, reject) {
    var d = "";
    req.on("data", function(c) { d += c; });
    req.on("end", function() { resolve(Buffer.from(d)); });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");
  var stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  var secret = process.env.STRIPE_WEBHOOK_SECRET;
  var event;
  try {
    var raw = await getRaw(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], secret);
  } catch(err) {
    console.error("Signature error:", err.message);
    return res.status(400).send("Webhook Error: " + err.message);
  }
  if (event.type === "checkout.session.completed") {
    var s = event.data.object;
    if (s.payment_status === "paid") {
      try { await createPrintifyOrder(s); } catch(err) { console.error("Fulfillment failed:", err.message); }
    }
  }
  return res.status(200).json({ received: true });
};
