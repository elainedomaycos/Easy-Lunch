# AI Chatbot Setup Instructions

## Quick Setup (Local Development)

### Option 1: OpenRouter (FREE! ✨ Recommended)

1. **Get your OpenRouter API Key** (100% FREE)
   - Go to https://openrouter.ai/
   - Sign up for a free account
   - Go to Keys section: https://openrouter.ai/keys
   - Create a new API key
   - Copy it (it starts with `sk-or-v1-...`)

2. **Add your API key to config.js**
   - Open `config.js`
   - Set `provider: 'openrouter'`
   - Set `apiKey: 'your-openrouter-key'`
   - Set `model: 'meta-llama/llama-3.2-3b-instruct:free'` (or another free model)
   - Save the file

3. **Test the chatbot**
   - Open `index.html` or `product.html` in your browser
   - Click the floating chat button
   - Type a message and see AI responses!

### Option 2: OpenAI (Paid)

1. **Get your OpenAI API Key**
   - Go to https://platform.openai.com/api-keys
   - Create a new API key
   - Copy it (it starts with `sk-proj-...`)

2. **Add your API key to config.js**
   - Open `config.js`
   - Set `provider: 'openai'`
   - Set `apiKey: 'your-openai-key'`
   - Set `model: 'gpt-3.5-turbo'`
   - Save the file

## How it Works

- The chatbot uses AI models (OpenRouter or OpenAI)
- API calls are made directly from the browser
- Your API key is stored in `config.js` (which is gitignored)
- If no API key is configured, it falls back to rule-based responses

## Why OpenRouter?

✅ **100% FREE** - No credit card required  
✅ **Multiple free models** - Llama, Mistral, Gemma  
✅ **No monthly limits** - Use as much as you need  
✅ **Same API format** - Easy to switch to OpenAI later  

## Available Free Models on OpenRouter

- `meta-llama/llama-3.2-3b-instruct:free` (recommended)
- `meta-llama/llama-3.2-1b-instruct:free` (faster, lighter)
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-2-9b-it:free`

## Security Notes

✅ **config.js is gitignored** - Your API key won't be committed to GitHub

⚠️ **Important:** This is a client-side integration, which means:
- Your API key is visible in the browser console/network tab
- Only use this for personal projects or demos
- For production, use a backend service or Firebase Functions

## Files Modified

- `chat.js` - Updated with AI integration (supports OpenAI & OpenRouter)
- `config.js` - Contains your API key (gitignored)
- `config.example.js` - Template file (safe to commit)
- `.gitignore` - Added config.js
- `style.css` - Added typing indicator animation
- `index.html` & `product.html` - Added config.js script tag
- `test-openai.html` - Test page for debugging

## Fallback Behavior

If OpenAI is not configured or fails:
- The chatbot automatically falls back to rule-based responses
- Users can still request human support
- All messages are logged to Firebase (if configured)

## Cost Estimation

- GPT-3.5-turbo costs about $0.002 per 1K tokens
- Average chat message: ~200 tokens (input + output)
- Cost per message: ~$0.0004
- 1000 messages: ~$0.40

## Customization

Edit `config.js` to customize:
```javascript
window.OPENAI_CONFIG = {
  apiKey: 'your-key',
  model: 'gpt-3.5-turbo',  // or 'gpt-4' for better responses
  maxTokens: 150           // increase for longer responses
};
```

## Troubleshooting

**"OpenAI API error: 401"**
- Check that your API key is correct
- Make sure your OpenAI account has credits

**"OpenAI API error: 429"**
- You've exceeded your rate limit
- Wait a few minutes or upgrade your OpenAI plan

**Chat not responding**
- Open browser console (F12) to see errors
- Check that config.js is loaded
- Verify your API key starts with `sk-`

## Pushing to GitHub

When you push to GitHub:
1. `config.js` is automatically ignored (not uploaded)
2. `config.example.js` IS uploaded (safe template)
3. Other developers copy `config.example.js` to `config.js` and add their own API key

## For Collaborators

If someone clones your repo:
1. They copy `config.example.js` to `config.js`
2. They add their own OpenAI API key
3. The chatbot works with their key
