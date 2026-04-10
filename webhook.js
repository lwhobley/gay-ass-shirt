// api/webhook.js
// Receives Stripe checkout.session.completed → auto-places order on Printful

const Stripe = require("stripe");

// Map your product names to Printful variant IDs
// You'll fill these in after setting up products in Printful
// Format: "Product Name": { S: variantId, M: variantId, ... }
const PRINTFUL_VARIANTS = {
  // Example — replace with real Printful variant IDs after setup:
  // "White Box Tee": { S: 123, M: 124, L: 125, XL: 126, XXL: 127 },
};

// Fallback — if no variant mapping found, log and notify
const PRINTFUL_PRODUCT_FALLBACK = null;

async function createPrintfulOrder(session) {
  const printfulKey = process.env.PRINTFUL_API_KEY;
  if (!printfulKey) {
    console.error("PRINTFUL_API_KEY not set");
    return;
  }

  const shipping = session.shipping_details;
  const customer = session.customer_details;

  // Extract custom fields (style + size)
  const customFields = session.custom_fields || [];
  const styleField = customFields.find(f => f.key === "style");
  const sizeField  = customFields.find(f => f.key === "size");

  const productName = session.metadata?.productName || styleField?.text?.value || "Unknown";
  const size = sizeField?.dropdown?.value || session.metadata?.size || "M";

  // Look up Printful variant ID
  const variantMap = PRINTFUL_VARIANTS[productName];
  const variantId  = variantMap ? variantMap[size] : PRINTFUL_PRODUCT_FALLBACK;

  // Build order payload for Printful API v2
  const orderPayload = {
    recipient: {
      name:         shipping?.name || customer?.name || "Customer",
      email:        customer?.email || "",
      phone:        customer?.phone || "",
      address1:     shipping?.address?.line1 || "",
      address2:     shipping?.address?.line2 || "",
      city:         shipping?.address?.city || "",
      state_code:   shipping?.address?.state || "",
      country_code: shipping?.address?.country || "US",
      zip:          shipping?.address?.postal_code || "",
    },
    items: variantId
      ? [{ variant_id: variantId, quantity: 1 }]
      : [{ name: productName, quantity: 1, variant_id: null }], // manual review if no variant
    retail_costs: {
      currency: "USD",
      subtotal: (session.amount_subtotal / 100).toFixed(2),
      shipping: "0.00",
      total:    (session.amount_total / 100).toFixed(2),
    },
    metadata: {
      stripe_session_id: session.id,
      product_name:      productName,
      size:              size,
    },
  };

  console.log("Placing Printful order:", JSON.stringify(orderPayload, null, 2));

  const response = await fetch("https://api.printful.com/v2/orders", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${printfulKey}`,
      "Content-Type":  "application/json",
      "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID || "",
    },
    body: JSON.stringify(orderPayload),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Printful order failed:", result);
    throw new Error(`Printful error: ${result.error?.message || JSON.stringify(result)}`);
  }

  console.log("Printful order created:", result.id || result.result?.id);
  return result;
}

// ── Webhook handler ───────────────────────────────────────────────
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // Verify Stripe signature
  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      req.headers["stripe-signature"],
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout completion
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Only process paid sessions
    if (session.payment_status === "paid") {
      console.log(`Processing order for session: ${session.id}`);
      try {
        await createPrintfulOrder(session);
        console.log("Order fulfilled successfully");
      } catch (err) {
        console.error("Fulfillment error:", err.message);
        // Return 200 so Stripe doesn't retry — log the error for manual review
        // In production you'd want to send yourself an alert email here
      }
    }
  }

  return res.status(200).json({ received: true });
};

// Vercel needs raw body for webhook signature verification
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => resolve(Buffer.from(data)));
    req.on("error", reject);
  });
}
