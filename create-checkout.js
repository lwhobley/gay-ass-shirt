// api/create-checkout.js
// Creates a Stripe Checkout session capturing product, size, style, and shipping address

const Stripe = require("stripe");

module.exports = async function handler(req, res) {
  // CORS headers so your GitHub Pages site can call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const {
    productName,   // e.g. "Black Graffiti Tee"
    productType,   // "tee" or "polo"
    size,          // "S", "M", "L", "XL", "XXL"
    quantity = 1,
    bundleType,    // optional: "2tee", "2polo", "mix", null
  } = req.body;

  if (!productName || !size) {
    return res.status(400).json({ error: "productName and size are required" });
  }

  // Price map — matches your Stripe prices
  const PRICES = {
    tee:        "price_1TCNFrKFbgDlLMiEQqLrJfU2",  // $25 single tee
    polo:       "price_1TCNG5KFbgDlLMiEJHwa5jhx",  // $40 single polo
    bundle_2tee:"price_1TCNGFKFbgDlLMiE43TkzBAB",  // $40 2-tee bundle
    bundle_2polo:"price_1TCNGOKFbgDlLMiEtDkbpTYO", // $70 2-polo bundle
    bundle_mix: "price_1TCNGXKFbgDlLMiE59GDp6rv",  // $60 mix bundle
    design1:    "price_1TCNGhKFbgDlLMiEfE7PNBoL",  // $35 lavender bubble
    design2:    "price_1TCNHvKFbgDlLMiEPQiI6cCJ",  // $35 teal rainbow
    design3:    "price_1TCNI3KFbgDlLMiEuP559rYx",  // $35 natural sparkle
    design4:    "price_1TCNICKFbgDlLMiEMh4EzyNK",  // $35 lime block
    design5:    "price_1TCNILKFbgDlLMiEUxoMP8Gx",  // $35 black graffiti
  };

  // Determine which price to use
  let priceId;
  if (bundleType === "2tee")  priceId = PRICES.bundle_2tee;
  else if (bundleType === "2polo") priceId = PRICES.bundle_2polo;
  else if (bundleType === "mix")   priceId = PRICES.bundle_mix;
  else if (productName.toLowerCase().includes("lavender retro")) priceId = PRICES.design1;
  else if (productName.toLowerCase().includes("teal rainbow"))   priceId = PRICES.design2;
  else if (productName.toLowerCase().includes("natural sparkle")) priceId = PRICES.design3;
  else if (productName.toLowerCase().includes("lime yellow"))    priceId = PRICES.design4;
  else if (productName.toLowerCase().includes("graffiti"))       priceId = PRICES.design5;
  else if (productType === "polo") priceId = PRICES.polo;
  else priceId = PRICES.tee;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity }],

      // Collect shipping address — Stripe handles this natively
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },

      // Collect phone number for order updates
      phone_number_collection: { enabled: true },

      // Custom fields to capture style + size
      custom_fields: [
        {
          key: "style",
          label: { type: "custom", custom: "Shirt Style" },
          type: "text",
          optional: false,
        },
        {
          key: "size",
          label: { type: "custom", custom: "Size (S, M, L, XL, XXL)" },
          type: "dropdown",
          optional: false,
          dropdown: {
            options: [
              { label: "S — Small",        value: "S"   },
              { label: "M — Medium",       value: "M"   },
              { label: "L — Large",        value: "L"   },
              { label: "XL — Extra Large", value: "XL"  },
              { label: "XXL — Double XL",  value: "XXL" },
            ],
          },
        },
      ],

      // Pre-fill style name from cart
      custom_text: {
        submit: { message: "Your order will be fulfilled by G.A.S. via Printful." },
      },

      // Pass product info through metadata for webhook
      metadata: {
        productName,
        productType: productType || "tee",
        size,
        bundleType: bundleType || "",
      },

      // Redirect URLs — update DOMAIN to your GitHub Pages URL
      success_url: `${process.env.DOMAIN || "https://your-site.github.io"}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.DOMAIN || "https://your-site.github.io"}`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};
