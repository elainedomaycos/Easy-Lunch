# 🤖 AI Chatbot Setup Guide for Easy Lunch

## ✅ What's Been Done

Your AI chatbot is now integrated into your Easy Lunch website! Here's what was set up:

### 1. **Backend AI Endpoint** (`server.js`)
- Added `/api/chat` endpoint that handles AI conversations
- Integrated OpenAI GPT-3.5-turbo model
- Configured with Easy Lunch menu, prices, and restaurant information
- Smart system prompt that knows your full menu and can help customers

### 2. **Frontend Chat Interface** (`chat.js`)
- Updated to connect with backend AI API
- Maintains conversation history for context
- Shows typing indicator while AI is thinking
- Falls back to smart rule-based responses if AI is unavailable

### 3. **Environment Configuration** (`.env`)
- Added `OPENAI_API_KEY` placeholder
- Ready to accept your API key

---

## 🔑 How to Get Your OpenAI API Key

### Step 1: Create OpenAI Account
1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Sign up with your email or Google account
3. Verify your email address

### Step 2: Get API Key
1. Log in to [https://platform.openai.com](https://platform.openai.com)
2. Click your profile icon (top right)
3. Select **"View API keys"** or go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Click **"Create new secret key"**
5. Give it a name (e.g., "Easy Lunch Chatbot")
6. **Copy the key immediately** (you won't see it again!)

### Step 3: Add Key to Your Project
1. Open `.env` file in your Easy Lunch folder
2. Find this line:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
3. Replace `your_openai_api_key_here` with your actual key:
   ```
   OPENAI_API_KEY=sk-proj-abc123xyz789...
   ```
4. Save the file

### Step 4: Restart Server
```powershell
# Stop the current server (Ctrl+C in terminal)
# Or close port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Start server again
node server.js
```

You should see:
```
PayMongo backend running on port 3000
✅ OpenAI initialized successfully
AI Chatbot: ✅ Enabled
```

---

## 💰 Pricing Information

### OpenAI GPT-3.5-Turbo Pricing:
- **$0.50** per 1 million input tokens
- **$1.50** per 1 million output tokens

### What does this mean?
- Average chat message: ~100-200 tokens
- **1,000 customer conversations** ≈ $0.10 - $0.30
- Very affordable for small businesses!

### Free Credits:
- New OpenAI accounts get **$5 free credits**
- Enough for thousands of customer conversations
- Credits expire after 3 months

---

## 🧪 How to Test Your AI Chatbot

### Once API key is added:

1. **Open your website** (any page - index.html, product.html, etc.)

2. **Click the floating chat button** (bottom right corner)

3. **Try these test messages:**

   ```
   Hi!
   → Should greet you and introduce Easy Lunch

   What's on your menu?
   → Should list chicken wings, pizza, combos with prices

   How much are the chicken wings?
   → Should provide specific pricing (₱149 each flavor)

   What combo meals do you have?
   → Should explain combo deals with prices

   How do I order?
   → Should explain ordering process

   What payment methods do you accept?
   → Should list GCash, PayPal, Cash on Delivery

   Do you deliver?
   → Should explain delivery within Lipa City, 30-45 min

   What are your hours?
   → Should say 10 AM - 10 PM daily
   ```

4. **Check browser console** (F12) for logs:
   - Should see: `🤖 Sending message to AI backend:`
   - Should see: `✅ AI response received:`

---

## 🎯 What the AI Chatbot Can Do

### ✅ Current Capabilities:
- **Answer menu questions** - All chicken wing flavors, pizzas, sides
- **Provide pricing** - Individual items and combo deals
- **Explain ordering process** - Step-by-step guidance
- **Payment methods** - GCash, PayPal, COD, Bank Transfer
- **Delivery information** - Timing, fees, coverage area
- **Store hours** - Operating times
- **Recommendations** - Suggest popular items and combos
- **Friendly conversation** - Natural, helpful responses

### 📋 The AI Knows:
- **All menu items with exact prices**
- **Combo meal options (A, B, C, D)**
- **Location: Lipa City, Batangas**
- **Payment methods**
- **Delivery details**
- **Operating hours: 10 AM - 10 PM**

---

## 🔧 Troubleshooting

### Problem: "AI service not available"
**Solution:** 
- Check `.env` file has correct API key
- Make sure key doesn't say `your_openai_api_key_here`
- Restart the server after adding key

### Problem: "Failed to get AI response"
**Possible causes:**
1. **No internet connection** - AI needs internet to work
2. **Invalid API key** - Double-check you copied it correctly
3. **Rate limit exceeded** - Wait a minute and try again
4. **Out of credits** - Check your OpenAI account billing

### Problem: AI responses are slow
**Normal behavior:**
- GPT-3.5 usually responds in 1-3 seconds
- Shows typing indicator while waiting
- Check your internet speed if consistently slow

### Problem: Server says "AI Chatbot: ❌ Disabled"
**Solution:**
- API key not set in `.env` file
- Add your OpenAI API key and restart server

---

## 📊 Monitoring Usage

### Check Your OpenAI Usage:
1. Go to [https://platform.openai.com/usage](https://platform.openai.com/usage)
2. View real-time usage and costs
3. Set spending limits if desired

### Set Budget Alerts:
1. Go to [https://platform.openai.com/account/billing/limits](https://platform.openai.com/account/billing/limits)
2. Set monthly budget (e.g., $10)
3. Get email alerts when approaching limit

---

## 🚀 What's Next?

### Optional Enhancements:
1. **Add images to AI responses** - Show product photos
2. **Direct ordering via chat** - "Add 6pc wings to cart"
3. **Order tracking in chat** - "Where's my order #12345?"
4. **Personalized recommendations** - Based on past orders
5. **Multilingual support** - Tagalog, English, etc.

### Alternative: Free Tier Options
If you want to avoid OpenAI costs, consider:
- **Rule-based chatbot** - Already implemented as fallback
- **Free AI models** - Like Google's Gemini (free tier available)

---

## 📝 Current Fallback Behavior

If AI is not available (no API key or error), the chatbot uses smart rule-based responses for:
- Menu questions
- Pricing inquiries
- Ordering instructions
- Payment methods
- Store hours
- General FAQs

This ensures your chatbot always works, even without AI!

---

## 💡 Tips for Best Results

1. **Keep API key secret** - Never commit `.env` file to Git
2. **Monitor usage** - Check OpenAI dashboard regularly
3. **Test regularly** - Make sure responses are accurate
4. **Update menu info** - Edit system prompt in `server.js` when menu changes
5. **Customer feedback** - Ask users if chatbot was helpful

---

## ✅ Summary Checklist

- [x] OpenAI package installed
- [x] Backend AI endpoint created (`/api/chat`)
- [x] Frontend chat updated to use AI
- [x] `.env` configured with API key placeholder
- [x] Server running on port 3000
- [x] Fallback responses ready
- [ ] **Get OpenAI API key** ← YOU ARE HERE
- [ ] **Add key to .env file**
- [ ] **Restart server**
- [ ] **Test chatbot**

---

## 🆘 Need Help?

If you encounter any issues:
1. Check the browser console (F12) for errors
2. Check the terminal/server logs
3. Verify `.env` file is in the same folder as `server.js`
4. Make sure server is running (`node server.js`)
5. Test with simple messages first

---

**Happy chatting! Your AI assistant is ready to help customers 24/7! 🤖🍗**
