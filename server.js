// Express backend for PayMongo GCash integration (TEST KEYS FIRST)
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PAYMONGO_SECRET = process.env.PAYMONGO_SECRET; // DO NOT COMMIT REAL KEY
const RETURN_URL_BASE = process.env.RETURN_URL_BASE || 'http://localhost:5500/index.html';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if(!PAYMONGO_SECRET) {
  console.warn('PAYMONGO_SECRET missing. Set it in .env or environment variable.');
}

// Initialize OpenAI
let openai = null;
if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
  openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  console.log('✅ OpenAI initialized successfully');
} else {
  console.warn('⚠️ OPENAI_API_KEY missing or not set. AI chatbot will not work.');
}

// Email notification setup (use environment variables for credentials)
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO || EMAIL_USER;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

function sendOrderNotification(order) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('Email credentials missing. Set EMAIL_USER and EMAIL_PASS in .env');
    return;
  }
  
  const paymentMethod = order.paymentMethod || 'GCash';
  const itemsList = (order.items || []).map(item => 
    `${item.name} x${item.quantity || 1} = ₱${item.price}`
  ).join('\n');
  
  const customerEmail = order.customer?.email?.trim();
  
  // Admin notification email
  const adminMailOptions = {
    from: EMAIL_USER,
    to: EMAIL_TO,
    subject: `🍽️ New Order Received: ${order.orderId || 'N/A'}`,
    text: `A new order has been placed at The Easy Lunch!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nORDER DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nOrder ID: ${order.orderId || 'N/A'}\nPayment Method: ${paymentMethod}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nCUSTOMER INFORMATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nName: ${order.customer?.name || 'N/A'}\nEmail: ${customerEmail || 'N/A'}\nPhone: ${order.customer?.phone || 'N/A'}\nAddress: ${order.customer?.address || 'N/A'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nORDER ITEMS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${itemsList || 'No items listed'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTOTAL AMOUNT: ₱${order.amount || 'N/A'}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nPlease process this order as soon as possible.\n\n---\nThe Easy Lunch Order System`
  };
  
  // Customer confirmation email
  const customerMailOptions = {
    from: EMAIL_USER,
    to: customerEmail,
    subject: `✅ Order Confirmation - ${order.orderId || 'N/A'}`,
    text: `Dear ${order.customer?.name || 'Customer'},\n\nThank you for your order at The Easy Lunch! 🍽️\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nYOUR ORDER DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nOrder ID: ${order.orderId || 'N/A'}\nPayment Method: ${paymentMethod}\nStatus: ${paymentMethod === 'cod' ? 'Pending (Pay on Delivery)' : 'Processing'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDELIVERY INFORMATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nName: ${order.customer?.name || 'N/A'}\nAddress: ${order.customer?.address || 'N/A'}\nPhone: ${order.customer?.phone || 'N/A'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nORDERED ITEMS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${itemsList || 'No items listed'}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nTOTAL AMOUNT: ₱${order.amount || 'N/A'}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${paymentMethod === 'cod' ? 'Please prepare the exact amount for payment upon delivery.' : 'Your payment is being processed.'}\n\nWe'll notify you once your order is on its way!\n\nFor questions or concerns, please contact us.\n\nThank you for choosing The Easy Lunch!\n\n---\nThe Easy Lunch\nYour satisfaction is our priority! 🍴`
  };
  
  // Send admin notification
  transporter.sendMail(adminMailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending admin notification email:', error);
    }
    console.log('Admin notification email sent:', info.response);
  });
  
  // Send customer confirmation (only if customer email is valid)
  if (customerEmail && customerEmail.includes('@')) {
    transporter.sendMail(customerMailOptions, (error, info) => {
      if (error) {
        return console.error('Error sending customer confirmation email:', error);
      }
      console.log('Customer confirmation email sent to:', customerEmail);
    });
  } else {
    console.warn('No valid customer email provided, skipping customer notification');
  }
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
    // Send email notification for new order
    sendOrderNotification({
      orderId,
      customer,
      amount,
      items: req.body.items || []
    });

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

// Cash on Delivery order notification endpoint
app.post('/order/cod', (req, res) => {
  try {
    const { orderId, customer, amount, items } = req.body;
    
    if (!orderId || !customer || !amount) {
      return res.status(400).json({ error: 'orderId, customer, and amount required' });
    }

    // Send email notification for COD order
    sendOrderNotification({
      orderId,
      customer,
      amount,
      items: items || [],
      paymentMethod: 'Cash on Delivery'
    });

    console.log(`COD Order notification sent for Order ID: ${orderId}`);
    res.json({ success: true, message: 'Order notification sent' });
  } catch (error) {
    console.error('COD order notification error:', error);
    res.status(500).json({ error: 'Failed to send order notification', details: error.message });
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

// AI Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI service not available', 
        message: 'OpenAI API key not configured. Please set OPENAI_API_KEY in .env file.' 
      });
    }

    const { message, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // System prompt that defines the chatbot's personality and knowledge
    const systemPrompt = `You are a friendly and helpful AI assistant for "The Easy Lunch" restaurant in Lipa City, Batangas, Philippines. 

MENU ITEMS & PRICES:
Chicken Wings:
- Classic BBQ Wings - ₱149
- Honey Garlic Wings - ₱149
- Lemon Pepper Wings - ₱149
- Korean Wings - ₱149
- Buffalo Wings - ₱149
- Cajun Brown Sugar Wings - ₱149
- Teriyaki Wings - ₱149
- Salted Egg Wings - ₱149

Pizza:
- Hawaiian Pizza - ₱199
- Classic BBQ Chicken Pizza - ₱199
- Pepperoni Pizza - ₱199

Sides & Drinks:
- French Fries - ₱49
- Coleslaw - ₱49
- Garlic Parmesan Fries - ₱59
- Garlic Butter Rice - ₱39
- Coca-Cola - ₱35
- Iced Tea - ₱35

Combos:
- Combo A: 6pc Wings + Fries + Drink - ₱249
- Combo B: 12pc Wings + Fries + Drink - ₱349
- Combo C: Pizza + Wings + 2 Drinks - ₱449
- Combo D: 2 Pizzas + 12pc Wings + 4 Drinks - ₱799

RESTAURANT INFO:
- Location: Lipa City, Batangas
- Payment Methods: GCash, PayPal, Cash on Delivery
- Delivery: Available within Lipa City
- Estimated Delivery Time: 30-45 minutes
- Operating Hours: 10:00 AM - 10:00 PM daily

YOUR ROLE:
- Help customers with menu questions
- Suggest meals based on preferences
- Explain prices and combo deals
- Assist with ordering process
- Answer questions about delivery and payment
- Be friendly, enthusiastic, and helpful
- Use emojis occasionally to be welcoming
- If customers want to order, guide them to add items to cart and checkout

IMPORTANT:
- Always mention prices in Philippine Pesos (₱)
- Be concise but friendly
- If asked about items not on menu, politely say we don't have that
- Encourage customers to try combo meals for better value`;

    // Build messages array for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({ 
      response: aiResponse,
      success: true 
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response', 
      message: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PayMongo backend running on port ${PORT}`);
  console.log(`AI Chatbot: ${openai ? '✅ Enabled' : '❌ Disabled'}`);
});
