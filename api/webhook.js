const Stripe = require("stripe");

const PRODUCTS = {
  "Rainbow Llama Tee":          { id: "69c0052547c38225cd0911b9", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "GAS Flame Logo Tee":         { id: "69c0052972bd7beeb4080c73", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Rainbow Stripes Tee":        { id: "69c0052e2aaf76a28d0ca574", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Neon Sign Tee":              { id: "69c00534a0e7f7c8e804bf9a", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Yellow Purple Bubble Tee":   { id: "69c0053947c38225cd0911bb", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Not Gay But 50 Is 50 Tee":   { id: "69c005408b056aa91c0eb7c4", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Dont Touch My GAS Tee":      { id: "69c00544bacaa499b7050d3b", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Its My GAS Bubble Tee":      { id: "69c0054afb6a01249f0bd140", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Glitter Script Tee":         { id: "69c00573fb6a01249f0bd14e", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Retro Pastel Tee":           { id: "69c00578a0e7f7c8e804bfab", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Retro Sunset Pride Tee":     { id: "69c0057d77c22d11f40f20f2", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "GAS Stamp Tee":              { id: "69c005829783bc339304e35e", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Original Groovy GAS Tee":    { id: "69c005879e715d0b9b0c0c01", S:18051, M:18053, L:18054, XL:18055, "2XL":18056 },
  "Ol Gay Ass Flame Polo":      { id: "69c0058b8cefd16fb30f7417", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Not Gay My Shirt Is Polo":   { id: "69c0058cfb6a01249f0bd156", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 },
  "Gay Ass Pastel Polo":        { id: "69c0058dcb7711ff6e0a1e9c", S:112158, M:112160, L:112162, XL:112164, "2XL":112166 }
};

async function createPrintifyOrder(session) {
  var token  = process.env.PRINTIFY_API_KEY;
  var shopId = process.env.PRINTIFY_SHOP_ID;
  if (!token || !shopId) { console.error("Missing Printify env vars"); return; }

  var shipping = session.shipping_details;
  var customer = session.customer_details;
  var productName = (session.metadata && session.metadata.productName) || "";
  var size = (session.metadata && session.metadata.size) || "M";
  size = size.toUpperCase().replace("XXL", "2XL");

  var product = PRODUCTS[productName];
  if (!product) {
    console.warn("No product found for:", productName);
    console.log("ORDER DETAILS:", JSON.stringify({ productName, size, customer: customer && customer.name }));
    return;
  }

  var variantId = product[size] || product["M"];
  var fullName  = (shipping && shipping.name) || (customer && customer.name) || "";
  var parts     = fullName.trim().split(" ");
  var addr      = (shipping && shipping.address) || {};

  var payload = {
    external_id: session.id,
    label: productName + " / " + size,
    line_items: [{ product_id: product.id, variant_id: variantId, quantity: 1 }],
    shipping_method: 1,
    send_shipping_notification: true,
    address_to: {
      first_name: parts[0] || "",
      last_name:  parts.slice(1).join(" ") || "",
      email:      (customer && customer.email) || "",
      phone:      (customer && customer.phone) || "",
      country:    addr.country     || "US",
      region:     addr.state       || "",
      address1:   addr.line1       || "",
      address2:   addr.line2       || "",
      city:       addr.city        || "",
      zip:        addr.postal_code || ""
    }
  };

  console.log("Placing Printify order:", JSON.stringify(payload));

  var resp = await fetch("https://api.printify.com/v1/shops/" + shopId + "/orders.json", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": "GASSite/1.0"
    },
    body: JSON.stringify(payload)
  });

  var result = await resp.json();
  if (!resp.ok) {
    console.error("Printify order failed:", JSON.stringify(result));
    throw new Error("Printify: " + (result.message || JSON.stringify(result)));
  }
  console.log("Printify order placed. ID:", result.id);
  return result;
}

function getRaw(req) {
  return new Promise(function(resolve, reject) {
    var d = "";
    req.on("data", function(c) { d += c; });
    req.on("end",  function()  { resolve(Buffer.from(d)); });
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
      try { await createPrintifyOrder(s); }
      catch(err) { console.error("Fulfillment failed:", err.message); }
    }
  }

  return res.status(200).json({ received: true });
};
