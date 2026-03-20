// api/webhook.js — PRINTIFY VERSION
// Receives Stripe checkout.session.completed → auto-places order on Printify

const Stripe = require("stripe");

// ── Printify variant IDs ──────────────────────────────────────────────
// HOW TO FILL THIS IN:
//   1. Sign up at printify.com → create your products with your PNG files
//   2. GET https://api.printify.com/v1/shops/{SHOP_ID}/products.json
//      Header: Authorization: Bearer YOUR_PRINTIFY_API_KEY
//   3. Each product has variants[] with "id" numbers — map them below
//
// Format per product:
//   "Exact Product Name": { _product_id: "printify_product_id", S: variantId, M: variantId, ... }

const PRINTIFY_VARIANTS = {
  // Add your products here after setting them up in Printify, e.g.:
  // "White Box Tee":               { _product_id: "abc123", S: 1001, M: 1002, L: 1003, XL: 1004, XXL: 1005 },
  // "Green Box Tee":               { _product_id: "abc124", S: 1006, M: 1007, L: 1008, XL: 1009, XXL: 1010 },
  // "Black Script Tee":            { _product_id: "abc125", S: 1011, M: 1012, L: 1013, XL: 1014, XXL: 1015 },
  // "Gold Collegiate Polo":        { _product_id: "abc126", S: 2001, M: 2002, L: 2003, XL: 2004, XXL: 2005 },
  // "Red Dragon Polo":             { _product_id: "abc127", S: 2006, M: 2007, L: 2008, XL: 2009, XXL: 2010 },
  // "Black Graffiti Tee":          { _product_id: "abc128", S: 1016, M: 1017, L: 1018, XL: 1019, XXL: 1020 },
};

async function createPrintifyOrder(session) {
  var printifyKey  = process.env.PRINTIFY_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6IjA5M2I5MTY2ODZiNzAxNzQ0MTVlYmY2NGYxZmVjYTQ5MTRhN2U0ZTMyMWY0MjcwMmQwNzAyMjQ2NzVhNGJjODQ5ZmIzMDYwMjZjYmIxZGFlIiwiaWF0IjoxNzc0MDQwNjQ1Ljg1MjI5LCJuYmYiOjE3NzQwNDA2NDUuODUyMjkyLCJleHAiOjE4MDU1NzY2NDUuODQzNDI0LCJzdWIiOiIyNjcwNzg1NCIsInNjb3BlcyI6WyJzaG9wcy5tYW5hZ2UiLCJzaG9wcy5yZWFkIiwiY2F0YWxvZy5yZWFkIiwib3JkZXJzLnJlYWQiLCJvcmRlcnMud3JpdGUiLCJwcm9kdWN0cy5yZWFkIiwicHJvZHVjdHMud3JpdGUiLCJ3ZWJob29rcy5yZWFkIiwid2ViaG9va3Mud3JpdGUiLCJ1cGxvYWRzLnJlYWQiLCJ1cGxvYWRzLndyaXRlIiwicHJpbnRfcHJvdmlkZXJzLnJlYWQiLCJ1c2VyLmluZm8iXX0.KjUut3-GLL_bwZY-XbxhCcI5jawupwIe45bb-IZ-wddCHpgxJx-lW2c2qhqgo6Qw5pB6O_qwICg938J2e9l4wuri0eO7wS7TviH5z6WrIL67R5bjQynatxSXaS-jBNFVWnet8YZi-KXPdm80JpTds8lifsda6tvCpQ8xXBpHPmGcH82AQLQ_bd0bD-uf9u2iMd8XgmH1wVYUNaiSplEta0YmUGpegyn-YcCJw0N3xFG7z_reT1h11xyhyMTg7A5EBkobq983yy33rh3OGgzBzFCgN9SwIS5NA9n6-kjKypT-SsSSsJNfs4iW-iQgjgaVYDmQ6TYkPLCx9RUAC3n1-VIAPq3KE2KeVTaGCF0NRLt-qegnRW2yNJJHS8rh1j0YZ3SyblnHwjkN1ZIyWzJDuXx44aVM0QuhA16I3mDD7IOPmNU4gstaBJlDJHlYdzKymXIKXgxs69OY1YHAZ5hQ5kMMFTe9RgR7w1YPr2lIWXgXMXqKjULVulEJhhp3lEKZg_FRe3Bdt4EGN9dEmNJpBxuAM2mLsJ0ERP3BOK-FgiCoazYPaO14VzQZthLkFMqf_OrFdjGTmKQ6b5h5L_t_pQ6fnJG6OrXQb5IIpk9dunfgYVjaq3lXSMBkyBBhJD92ugmOewdiv99apuqxrXwy05LR9TfAknT-R-7fMJFkcag';
  var printifyShop = process.env.PRINTIFY_SHOP_ID;

  if (!printifyKey || !printifyShop) {
    console.error("Missing env vars: PRINTIFY_API_KEY or PRINTIFY_SHOP_ID");
    return;
  }

  var shipping = session.shipping_details;
  var customer = session.customer_details;

  // Product name + size from Stripe metadata (populated in create-checkout.js)
  var productName = (session.metadata && session.metadata.productName) || "Unknown";
  var size        = (session.metadata && session.metadata.size)        || "M";

  // Also check Stripe custom fields as fallback
  var customFields = session.custom_fields || [];
  var sizeField = customFields.find(function(f) { return f.key === "size"; });
  if (sizeField && sizeField.dropdown) size = sizeField.dropdown.value;

  var variantMap = PRINTIFY_VARIANTS[productName];
  if (!variantMap) {
    // No variant mapping found — log for manual fulfillment
    console.warn("No Printify mapping for:", productName, "— manual fulfillment needed");
    console.log("ORDER DETAILS:", JSON.stringify({
      stripe_session: session.id,
      product: productName,
      size: size,
      name: customer && customer.name,
      email: customer && customer.email,
      address: shipping && shipping.address
    }, null, 2));
    return;
  }

  var variantId = variantMap[size];
  if (!variantId) {
    console.warn("No variant ID for size:", size, "product:", productName);
    return;
  }

  var fullName  = (shipping && shipping.name) || (customer && customer.name) || "";
  var parts     = fullName.trim().split(" ");
  var addr      = (shipping && shipping.address) || {};

  var payload = {
    external_id: session.id,
    label:       productName + " / " + size,
    line_items: [{
      product_id: variantMap._product_id,
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
    "https://api.printify.com/v1/shops/" + printifyShop + "/orders.json",
    {
      method:  "POST",
      headers: {
        "Authorization": "Bearer " + printifyKey,
        "Content-Type":  "application/json",
        "User-Agent":    "GASSite/1.0"
      },
      body: JSON.stringify(payload)
    }
  );

  var result = await resp.json();
  if (!resp.ok) {
    console.error("Printify API error:", JSON.stringify(result));
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
