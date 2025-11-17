// Express backend for PayMongo GCash integration (TEST KEYS FIRST)
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET; // DO NOT COMMIT REAL KEY
const RETURN_URL_BASE = process.env.RETURN_URL_BASE || 'http://localhost:5500/index.html';

if(!PAYMONGO_SECRET) {
  console.warn('PAYMONGO_SECRET missing. Set it in .env or environment variable.');
}

// Helper: PayMongo auth header
function paymongoHeaders() {
  return {
    auth: { username: PAYMONGO_SECRET, password: '' }
  };
}

// Create GCash Payment Intent + Payment Method + Attach
app.post('/paymongo/gcash', async (req, res) => {
  try {
    const { amount, orderId, customer } = req.body;
    if(!amount || !orderId) {
      return res.status(400).json({ error: 'amount and orderId required' });
    }
    const amountCentavos = Math.round(amount * 100);

    // 1. Create payment intent
    const intentResp = await axios.post('https://api.paymongo.com/v1/payment_intents', {
      data: {
        attributes: {
          amount: amountCentavos,
          payment_method_allowed: ['gcash'],
          payment_method_options: { gcash: { } },
          currency: 'PHP',
          description: `Order ${orderId}`,
          metadata: { orderId }
        }
      }
    }, paymongoHeaders());

    const intentId = intentResp.data.data.id;

    // 2. Create payment method (GCash)
    const pmResp = await axios.post('https://api.paymongo.com/v1/payment_methods', {
      data: {
        attributes: {
          type: 'gcash',
          billing: {
            name: customer?.name || 'Guest',
            email: customer?.email || 'guest@example.com',
            phone: customer?.phone || ''
          }
        }
      }
    }, paymongoHeaders());

    const paymentMethodId = pmResp.data.data.id;

    // 3. Attach payment method to intent
    const attachResp = await axios.post(`https://api.paymongo.com/v1/payment_intents/${intentId}/attach`, {
      data: {
        attributes: {
          payment_method: paymentMethodId,
          return_url: `${RETURN_URL_BASE}?intent=${intentId}&orderId=${orderId}`
        }
      }
    }, paymongoHeaders());

    const redirectUrl = attachResp.data.data.attributes.next_action.redirect.url;

    res.json({ intentId, redirectUrl });
  } catch (e) {
    console.error('PayMongo GCash error:', e.response?.data || e.message);
    res.status(500).json({ error: 'Failed to create GCash payment', details: e.response?.data || e.message });
  }
});

// Fetch intent status
app.get('/paymongo/intent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const resp = await axios.get(`https://api.paymongo.com/v1/payment_intents/${id}`, paymongoHeaders());
    res.json({ status: resp.data.data.attributes.status, raw: resp.data.data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch intent', details: e.response?.data || e.message });
  }
});

// Webhook endpoint (configure in PayMongo dashboard)
app.post('/paymongo/webhook', (req, res) => {
  // TODO: verify signature (PayMongo provides X-Paymongo-Signature header)
  const event = req.body;
  try {
    if(event?.data?.attributes?.type === 'payment_intent') {
      const intentStatus = event.data.attributes.data?.attributes?.status;
      const orderId = event.data.attributes.data?.attributes?.metadata?.orderId;
      console.log('Webhook payment_intent:', intentStatus, orderId);
      // TODO: update order status in database (Firestore) using orderId
    }
    if(event?.data?.attributes?.type === 'payment') {
      console.log('Payment event:', event.data.attributes);
    }
  } catch(err) {
    console.error('Webhook processing error:', err);
  }
  res.status(200).json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PayMongo backend running on port ${PORT}`);
});
