# G.A.S. Fulfillment API

Stripe Checkout + Printful auto-fulfillment, deployed on Vercel.

## Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/create-checkout` | POST | Creates a Stripe Checkout session with shipping + size collection |
| `/api/webhook` | POST | Receives Stripe events, auto-places Printful order |

---

## Setup

### 1. Environment Variables (set in Vercel dashboard)

| Variable | Where to find it |
|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks → your endpoint → Signing secret |
| `PRINTFUL_API_KEY` | Printful Dashboard → Settings → API → Generate token |
| `PRINTFUL_STORE_ID` | Printful Dashboard → Settings → Stores → Store ID |
| `DOMAIN` | Your GitHub Pages URL e.g. `https://yourusername.github.io/gay-ass-shirts` |

### 2. Register the Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **Add endpoint**
3. URL: `https://YOUR-PROJECT.vercel.app/api/webhook`
4. Events to listen for: `checkout.session.completed`
5. Copy the **Signing secret** → paste into Vercel env as `STRIPE_WEBHOOK_SECRET`

### 3. Set up Printful products

1. Sign up at printful.com
2. Go to **Stores → Add Store → Manual Order Platform** (or API)
3. Upload your SVG designs and create each product
4. Note the **Variant IDs** for each product × size combination
5. Add them to the `PRINTFUL_VARIANTS` map in `api/webhook.js`:

```js
const PRINTFUL_VARIANTS = {
  "White Box Tee":        { S: 12345, M: 12346, L: 12347, XL: 12348, XXL: 12349 },
  "Black Graffiti Tee":   { S: 22345, M: 22346, L: 22347, XL: 22348, XXL: 22349 },
  // ... one entry per product
};
```

### 4. Update your catalog site

Replace the checkout buttons in your `index.html` to call this API instead of
linking directly to Stripe Payment Links:

```js
async function checkout() {
  const response = await fetch("https://YOUR-PROJECT.vercel.app/api/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      productName: "Black Graffiti Tee",
      productType: "tee",
      size: selectedSize,      // from your size selector
      quantity: 1,
    })
  });
  const { url } = await response.json();
  window.location.href = url;  // redirect to Stripe Checkout
}
```

---

## Flow

```
Customer picks shirt + size → clicks Pay with Stripe
         ↓
POST /api/create-checkout  →  Stripe Checkout session created
         ↓
Customer fills in shipping address + confirms size on Stripe page
         ↓
Payment succeeds → Stripe fires checkout.session.completed webhook
         ↓
POST /api/webhook  →  reads name, address, size, style
         ↓
POST to Printful API  →  order placed automatically
         ↓
Printful prints + ships to customer
```
