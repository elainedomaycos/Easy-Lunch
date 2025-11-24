// AI Configuration
// Copy this file to config.js and add your API key
// DO NOT commit config.js to GitHub!

// Option 1: OpenAI (paid)
window.OPENAI_CONFIG = {
  apiKey: 'YOUR_OPENAI_API_KEY_HERE',
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  maxTokens: 150
};

// Option 2: OpenRouter (free models available)
// window.OPENAI_CONFIG = {
//   apiKey: 'YOUR_OPENROUTER_API_KEY_HERE',
//   provider: 'openrouter',
//   model: 'meta-llama/llama-3.2-3b-instruct:free', // Free model
//   maxTokens: 150
// };

// Other free OpenRouter models:
// - meta-llama/llama-3.2-3b-instruct:free
// - meta-llama/llama-3.2-1b-instruct:free
// - mistralai/mistral-7b-instruct:free
// - google/gemma-2-9b-it:free
