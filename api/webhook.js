// api/webhook.js
// Receives Stripe checkout.session.completed → auto-places order on Printify

const Stripe = require("stripe");

// ── Printify product + variant IDs ───────────────────────────────────
// product_id: Printify product ID
// S/M/L/XL/2XL: Printify variant IDs

const PRINTIFY_PRODUCTS = {
  // ── Tees (Blueprint 12 — Bella+Canvas 3001, Provider 99) ──────────
  "White Box Tee":               { product_id: "69be76ecb55cf6a51f006325", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Green Box Tee":               { product_id: "69be76f4cb7711ff6e09d6b1", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Grey Heather Collegiate Tee": { product_id: "69be76faa44a9fea8608068a", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Gold Collegiate Tee":         { product_id: "69be76ff74db54a45c0f7610", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Lavender Script Tee":         { product_id: "69be7706d6d23927760b6cef", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Black Script Tee":            { product_id: "69be770ba44a9fea8608068b", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Teal Minimal Tee":            { product_id: "69be771074db54a45c0f7614", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Navy Retro Bubble Tee":       { product_id: "69be7715a44a9fea86080690", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Coral Retro Bubble Tee":      { product_id: "69be771ad6d23927760b6cf3", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Pink Pocket Script Tee":      { product_id: "69be771f1b8d5d4d6c02ddc9", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Lavender Retro Bubble Tee":   { product_id: "69be7724f2799e1de1039e0d", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Teal Rainbow Bold Tee":       { product_id: "69be772a1b7fea1a260b4f1e", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Natural Sparkle Script Tee":  { product_id: "69be772fb55cf6a51f006338", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Lime Yellow Block Tee":       { product_id: "69be77351b8d5d4d6c02ddd2", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Black Graffiti Tee":          { product_id: "69be773a1b7fea1a260b4f21", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  // ── Polos (Blueprint 1604 — AOP Polo, Provider 10) ────────────────
  "Gold Collegiate Polo":        { product_id: "69be773ecb7711ff6e09d6c3", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Navy Script Polo":            { product_id: "69be7740f5cbf780aa041cab", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Lavender Script Polo":        { product_id: "69be7741f5cbf780aa041cac", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Black Pride Retro Polo":      { product_id: "69be7742f2799e1de1039e13", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Navy PanPride Polo":          { product_id: "69be77441b8d5d4d6c02ddd5", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Purple Mardi Gras Polo":      { product_id: "69be7745a44a9fea8608069a", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Purple Mardi Gras AllOver":   { product_id: "69be7748d6d23927760b6d07", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Green Christmas Polo":        { product_id: "69be774af2799e1de1039e15", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Pink Valentines Polo":        { product_id: "69be774bcb7711ff6e09d6c9", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Black Halloween Polo":        { product_id: "69be774cf5cbf780aa041cb3", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Red Dragon Polo":             { product_id: "69be774db55cf6a51f00633f", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
};

async function createPrintifyOrder(session) {
  var token  = process.env.PRINTIFY_API_KEY;
  var shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) { console.error("Missing Printify env vars"); return; }

  var shipping = session.shipping_details;
  var customer = session.customer_details;
  var productName = (session.metadata && session.metadata.productName) || "Unknown";
  var size        = (session.metadata && session.metadata.size) || "M";

  // Normalize size
  size = size.toUpperCase().replace("XXL","2XL");

  var product = PRINTIFY_PRODUCTS[productName];
  if (!product) {
    console.warn("No Printify product for:", productName, "— manual fulfillment needed");
    console.log("ORDER:", JSON.stringify({ productName, size, customer: customer && customer.name, address: shipping && shipping.address }));
    return;
  }

  var variantId = product[size] || product["M"];
  var fullName  = (shipping && shipping.name) || (customer && customer.name) || "";
  var parts     = fullName.trim().split(" ");
  var addr      = (shipping && shipping.address) || {};

  var payload = {
    external_id: session.id,
    label:       productName + " / " + size,
    line_items: [{
      product_id: product.product_id,
      variant_id: variantId,
      quantity:   1
    }],
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: {
      first_name: parts[0] || "",
      last_name:  parts.slice(1).join(" ") || "",
      email:      (customer && customer.email) || "",
      phone:      (customer && customer.phone) || "",
      country:    addr.country      || "US",
      region:     addr.state        || "",
      address1:   addr.line1        || "",
      address2:   addr.line2        || "",
      city:       addr.city         || "",
      zip:        addr.postal_code  || ""
    }
  };

  console.log("Placing Printify order:", JSON.stringify(payload, null, 2));

  var resp = await fetch(
    "https://api.printify.com/v1/shops/" + shopId + "/orders.json",
    {
      method:  "POST",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type":  "application/json",
        "User-Agent":    "GASSite/1.0"
      },
      body: JSON.stringify(payload)
    }
  );

  var result = await resp.json();
  if (!resp.ok) {
    console.error("Printify order failed:", JSON.stringify(result));
    throw new Error("Printify: " + (result.message || JSON.stringify(result)));
  }

  console.log("Printify order placed. ID:", result.id);
  return result;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  var stripe  = new Stripe(process.env.STRIPE_SECRET_KEY);
  var secret  = process.env.STRIPE_WEBHOOK_SECRET;
  var event;

  try {
    var raw = await getRaw(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], secret);
  } catch (err) {
    console.error("Signature error:", err.message);
    return res.status(400).send("Webhook Error: " + err.message);
  }

  if (event.type === "checkout.session.completed") {
    var s = event.data.object;
    if (s.payment_status === "paid") {
      try { await createPrintifyOrder(s); }
      catch (err) { console.error("Fulfillment failed:", err.message); }
    }
  }

  return res.status(200).json({ received: true });
};

function getRaw(req) {
  return new Promise(function(resolve, reject) {
    var d = "";
    req.on("data", function(c) { d += c; });
    req.on("end",  function()  { resolve(Buffer.from(d)); });
    req.on("error", reject);
  });
}
