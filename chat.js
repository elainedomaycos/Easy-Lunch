// Floating Customer Service Chat
(function () {
  function ensureChatWindow() {
    if (document.getElementById('chatWindow')) return;
    const chat = document.createElement('div');
    chat.id = 'chatWindow';
    chat.className = 'chat-window';
    chat.innerHTML = `
      <div class="chat-card">
        <div class="chat-header">
          <div class="chat-title">Easy Lunch Support</div>
          <div class="chat-actions">
            <button class="chat-escalate" id="chatEscalate" aria-label="Contact a human">👤</button>
            <button class="chat-min" id="chatMin" aria-label="Minimize">—</button>
            <button class="chat-close" id="chatClose" aria-label="Close">×</button>
          </div>
        </div>
        <div class="chat-body">
          <div class="chat-messages" id="chatMessages">
            <div class="msg bot">Hi! How can I help you today?</div>
          </div>
          <div class="chat-input-row">
            <input type="text" class="chat-input" id="chatInput" placeholder="Type your message..." autocomplete="off">
            <button class="chat-send" id="chatSend">Send</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(chat);
    const closeBtn = chat.querySelector('#chatClose');
    const minBtn = chat.querySelector('#chatMin');
    const escalateBtn = chat.querySelector('#chatEscalate');
    const sendBtn = chat.querySelector('#chatSend');
    const input = chat.querySelector('#chatInput');
    const messages = chat.querySelector('#chatMessages');

    closeBtn.addEventListener('click', () => {
      chat.style.display = 'none';
    });
    minBtn.addEventListener('click', () => {
      chat.classList.toggle('minimized');
    });
    if (escalateBtn) {
      escalateBtn.addEventListener('click', requestHuman);
    }
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
    sendBtn.addEventListener('click', sendMessage);

    function appendMessage(text, who) {
      const div = document.createElement('div');
      div.className = `msg ${who}`;
      div.textContent = text;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      saveMessage(who, text);
    }

    async function botReply(userText) {
      // Show typing indicator
      const typingDiv = document.createElement('div');
      typingDiv.className = 'msg bot typing';
      typingDiv.innerHTML = '<span></span><span></span><span></span>';
      messages.appendChild(typingDiv);
      messages.scrollTop = messages.scrollHeight;

      try {
        console.log('botReply called with:', userText);
        console.log('Config available:', !!window.OPENAI_CONFIG);
        console.log('API key set:', window.OPENAI_CONFIG?.apiKey ? 'Yes' : 'No');
        console.log('sendMessageToOpenAI function:', typeof window.sendMessageToOpenAI);
        
        // Check if OpenAI is configured
        if (window.OPENAI_CONFIG && window.OPENAI_CONFIG.apiKey && 
            !window.OPENAI_CONFIG.apiKey.includes('YOUR_') &&
            typeof window.sendMessageToOpenAI === 'function') {
          
          console.log('Calling OpenAI...');
          const reply = await window.sendMessageToOpenAI(userText);
          console.log('Got reply:', reply);
          
          if (typingDiv.parentNode) {
            messages.removeChild(typingDiv);
          }
          appendMessage(reply, 'bot');
        } else {
          // Fallback to rule-based responses if no API key
          console.log('Using fallback responses');
          if (typingDiv.parentNode) {
            messages.removeChild(typingDiv);
          }
          const t = userText.toLowerCase();
          let reply = "Thanks! A human agent will follow up shortly.";
          if (t.includes('price') || t.includes('cost') || t.includes('how much')) {
            reply = "You can view prices in the Products page. What item are you looking for?";
          } else if (t.includes('order') || t.includes('deliver') || t.includes('pickup')) {
            reply = "We offer delivery and pickup. Could you share your location and preferred time?";
          } else if (t.includes('menu') || t.includes('product')) {
            reply = "Browse our full menu on the Products page. Need help finding something?";
          } else if (t.includes('hours') || t.includes('open')) {
            reply = "We're typically open 10am–9pm. Special hours may apply on holidays.";
          } else if (t.includes('promo') || t.includes('discount') || t.includes('coupon')) {
            reply = "Subscribe to our newsletter for promos, or ask me for current deals!";
          }
          setTimeout(() => appendMessage(reply, 'bot'), 500);
        }
      } catch (error) {
        console.error('Chat error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (typingDiv.parentNode) {
          messages.removeChild(typingDiv);
        }
        
        // If rate limited or error, use smart fallback
        console.log('AI failed, using smart fallback response');
        const t = userText.toLowerCase();
          let reply = "";
        
          if (t.match(/^(hi|hello|hey|good morning|good afternoon|good evening|sup|yo)$/i) || t.includes('how are you')) {
            reply = "Hello! Welcome to Easy Lunch! 🍗 We specialize in delicious chicken wings, pizza, burgers, and combo meals. How can I help you today?";
          }
          else if (t.includes('menu') || t.includes('food') || t.includes('what do you have') || t.includes('what do you sell') || t.includes('product')) {
            reply = "Our menu features:\n\n🍗 Chicken Wings - Buffalo, Lemon Pepper, Teriyaki, Honey Garlic, Salted Egg, BBQ, Cajun, Parmesan & more!\n\n🍕 Pizza - Hawaiian, Pepperoni, Classic, BBQ Chicken\n\n🍔 Burgers & Sides - Rice, Dips, Drinks\n\n💰 Combo Meals - Great value meals!\n\nVisit our Products page to see full menu with prices!";
          }
          else if (t.includes('wing') || t.includes('chicken')) {
            reply = "Our chicken wings are our specialty! 🍗\n\nFlavors:\n• Buffalo Wings (classic spicy)\n• Lemon Pepper (tangy & zesty)\n• Teriyaki (sweet & savory)\n• Honey Garlic (sweet)\n• Salted Egg (creamy & rich)\n• BBQ (smoky)\n• Cajun (spicy & seasoned)\n• Parmesan Garlic\n\nPerfect for any occasion! Check Products page for prices & photos.";
          }
          else if (t.includes('pizza')) {
            reply = "We have amazing pizzas! 🍕\n\n• Hawaiian Pizza - Ham, pineapple, cheese\n• Pepperoni Pizza - Classic favorite\n• Classic Pizza - Cheese & tomato\n• BBQ Chicken Pizza - Smoky & delicious\n\nAll made fresh with quality ingredients. Check our Products page for prices!";
          }
          else if (t.includes('price') || t.includes('cost') || t.includes('how much') || t.includes('expensive') || t.includes('cheap')) {
            reply = "Our prices are very affordable! 💰\n\n• Chicken Wings: Starting from ₱150-₱300\n• Pizza: ₱200-₱400\n• Combo Meals: ₱250-₱500\n• Drinks & Sides: ₱30-₱100\n\nVisit our Products page to see exact prices for each item. We offer great value combo meals too!";
          }
          else if (t.includes('deliver') || t.includes('order') || t.includes('buy') || t.includes('purchase') || t.includes('get food')) {
            reply = "Easy ordering! 🚗\n\n1. Browse our Products page\n2. Add items to cart\n3. Click checkout\n4. Enter delivery address\n5. Choose payment method\n6. Place order!\n\nWe offer:\n✅ Fast delivery (₱30 fee)\n✅ Cash on Delivery\n✅ GCash payment\n✅ Bank Transfer\n✅ PayPal\n\nDelivery usually takes 30-45 minutes!";
          }
          else if (t.includes('pay') || t.includes('payment') || t.includes('gcash') || t.includes('cash') || t.includes('paypal') || t.includes('bank')) {
            reply = "We accept multiple payment methods! 💳\n\n✅ Cash on Delivery (COD)\n✅ GCash\n✅ Bank Transfer (BPI, BDO)\n✅ PayPal\n\nAll methods are secure. Choose your preferred option at checkout!";
          }
          else if (t.includes('hour') || t.includes('open') || t.includes('close') || t.includes('when') || t.includes('time')) {
            reply = "We're open daily! 🕐\n\nRegular Hours:\n📅 Monday - Sunday\n⏰ 10:00 AM - 9:00 PM\n\n*Special hours may apply on holidays\n\nOrder now and get your food fresh and hot!";
          }
          else if (t.includes('promo') || t.includes('discount') || t.includes('coupon') || t.includes('deal') || t.includes('sale') || t.includes('special')) {
            reply = "We have amazing deals! 🎉\n\n• Combo Meals - Save up to 20%!\n• Best Seller items marked on menu\n• Regular seasonal promotions\n\nSubscribe to our newsletter for:\n📧 Exclusive discounts\n🎁 Special offers\n🆕 New menu items\n\nCheck our homepage for current promos!";
          }
          else if (t.includes('location') || t.includes('address') || t.includes('where') || t.includes('find you')) {
            reply = "Find us easily! 📍\n\nVisit our About Us page for:\n• Exact location & address\n• Contact information\n• Map directions\n\nWe deliver to most areas! Enter your address at checkout to confirm delivery availability.";
          }
          else if (t.includes('combo') || t.includes('meal') || t.includes('set')) {
            reply = "Our combo meals are great value! 🍱\n\n• Wings + Rice + Drink\n• Pizza + Wings combo\n• Burger + Fries + Drink\n• Family meal deals\n\nSave money with combos vs ordering separately! Check Products page for all combo options and prices.";
          }
          else if (t.includes('long') || t.includes('fast') || t.includes('quick') || t.includes('delivery time') || t.includes('how soon')) {
            reply = "Fast delivery guaranteed! ⚡\n\n⏱️ Average delivery time: 30-45 minutes\n🚗 Delivery fee: ₱30\n📦 Order tracking available\n\nWe prepare your food fresh when you order, ensuring quality and taste!";
          }
          else if (t.includes('contact') || t.includes('phone') || t.includes('email') || t.includes('call') || t.includes('reach')) {
            reply = "Get in touch! 📞\n\nVisit our About Us page for:\n• Phone number\n• Email address\n• Social media links\n\nOr use this chat - I'm here to help! Need to speak with a human? Let me know and I'll connect you with our team.";
          }
          else if (t.includes('human') || t.includes('agent') || t.includes('staff') || t.includes('person') || t.includes('talk to someone')) {
            reply = "I can connect you with our team! 👤\n\nClick the person icon (👤) at the top of this chat to request human support. Our staff will assist you shortly!\n\nOr continue chatting with me - I can help with menu, orders, delivery, and more!";
          }
          else if (t.includes('allerg') || t.includes('ingredient') || t.includes('contain') || t.includes('gluten') || t.includes('nut')) {
            reply = "We take allergies seriously! ⚠️\n\nFor detailed ingredient information and allergy concerns, please:\n1. Click the 👤 icon to request human support\n2. Our team will provide specific ingredient details\n3. We can accommodate special requests when possible\n\nYour safety is our priority!";
          }
          else if (t.includes('feedback') || t.includes('review') || t.includes('complain') || t.includes('suggest')) {
            reply = "We value your feedback! 💭\n\nShare your experience:\n• Use the 👤 icon to speak with our team\n• Email us (see About Us page)\n• Leave a review on our social media\n\nWe're always improving based on customer feedback. Thank you for helping us serve you better!";
          }
          else if (t.includes('thank') || t.includes('thanks') || t.includes('appreciate')) {
            reply = "You're very welcome! 😊 Enjoy your meal from Easy Lunch! If you need anything else, just ask!";
          }
          else {
            reply = "I'm here to help with Easy Lunch! 🍗\n\nI can answer questions about:\n• Menu & Products\n• Prices & Deals\n• Ordering & Delivery\n• Payment methods\n• Store hours\n• And more!\n\nWhat would you like to know? Or click the 👤 icon to speak with our team!";
          }
        
        appendMessage(reply, 'bot');
      }
    }

    function sendMessage() {
      const val = input.value.trim();
      if (!val) return;
      appendMessage(val, 'user');
      input.value = '';
      botReply(val);
      // Persist a small transcript (last 20)
      try {
        const key = 'chatTranscript';
        const raw = localStorage.getItem(key);
        const arr = raw ? JSON.parse(raw) : [];
        arr.push({ at: Date.now(), who: 'user', text: val });
        if (arr.length > 40) arr.splice(0, arr.length - 40);
        localStorage.setItem(key, JSON.stringify(arr));
      } catch {}
    }

    // Firestore integration
    let db = null;
    let rtdb = null;
    let sessionId = null;
    function initFirestore() {
      try {
        if (firebase && firebase.firestore) {
          db = firebase.firestore();
        }
      } catch {}
      try {
        if (firebase && firebase.database) {
          rtdb = firebase.database();
        }
      } catch {}
      if (!db) return;
      // Ensure a session id
      sessionId = localStorage.getItem('chatSessionId');
      if (!sessionId) {
        sessionId = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('chatSessionId', sessionId);
      }
      // Create/update session doc
      const user = (firebase.auth && firebase.auth().currentUser) ? firebase.auth().currentUser : null;
      const sessionRef = db.collection('chat_sessions').doc(sessionId);
      sessionRef.set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastActiveAt: firebase.firestore.FieldValue.serverTimestamp(),
        userUid: user ? user.uid : null,
        userEmail: user ? user.email : null,
        humanRequested: false
      }, { merge: true }).catch(() => {});
      // Mirror session to Realtime Database (basic fields)
      if (rtdb) {
        const rtSessionRef = rtdb.ref('chat_sessions/' + sessionId);
        rtSessionRef.update({
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          userUid: user ? user.uid : null,
          userEmail: user ? user.email : null,
          humanRequested: false
        }).catch(() => {});
      }
      // Save initial bot greeting
      saveMessage('bot', 'Hi! How can I help you today?', true);
    }

    function updateLastActive() {
      if (db && sessionId) {
        db.collection('chat_sessions').doc(sessionId).set({
          lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(() => {});
      }
      if (rtdb && sessionId) {
        rtdb.ref('chat_sessions/' + sessionId).update({
          lastActiveAt: Date.now()
        }).catch(() => {});
      }
    }

    function saveMessage(sender, text, skipUpdate) {
      if (!sessionId) return;
      if (db) {
        db.collection('chat_sessions').doc(sessionId).collection('messages').add({
          at: firebase.firestore.FieldValue.serverTimestamp(),
          sender,
          text
        }).then(() => {
          if (!skipUpdate) updateLastActive();
        }).catch(() => {});
      }
      if (rtdb) {
        rtdb.ref('chat_sessions/' + sessionId + '/messages').push({
          at: Date.now(),
          sender,
          text
        }).catch(() => {});
      }
    }

    function requestHuman() {
      if (!sessionId) { appendMessage('We have flagged your request for a human agent.', 'bot'); return; }
      let ok = false;
      if (db) {
        db.collection('chat_sessions').doc(sessionId).set({
          humanRequested: true,
          lastActiveAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).then(() => { ok = true; }).catch(() => {});
      }
      if (rtdb) {
        rtdb.ref('chat_sessions/' + sessionId).update({
          humanRequested: true,
          lastActiveAt: Date.now()
        }).then(() => { ok = true; }).catch(() => {});
      }
      appendMessage(ok ? 'Okay! A human agent has been requested. We will reach out soon.' : 'We have flagged your request for a human agent.', 'bot');
    }

    initFirestore();
  }

  function toggleChat() {
    ensureChatWindow();
    const panel = document.getElementById('chatWindow');
    if (!panel) return;
    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
  }

  function init() {
    const button = document.getElementById('floatingChat');
    if (!button) return;
    button.addEventListener('click', toggleChat);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Rate limiting tracker
window.lastAIRequest = 0;

// AI Integration - Global function (supports OpenAI and OpenRouter)
window.sendMessageToOpenAI = async function(message, modelOverride = null) {
  try {
    console.log('Sending message to AI:', message);
    
    const config = window.OPENAI_CONFIG;
    
    if (!config || !config.apiKey) {
      throw new Error('AI config not found');
    }
    
    // Rate limiting - wait if too soon after last request
    const now = Date.now();
    const timeSinceLastRequest = now - window.lastAIRequest;
    const minDelay = config.rateLimitDelay || 1000;
    
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    window.lastAIRequest = Date.now();
    
    const modelToUse = modelOverride || config.model;
    console.log('Using provider:', config.provider || 'openai');
    console.log('Using model:', modelToUse);
    
    // Determine API endpoint
    const apiEndpoint = config.apiEndpoint || 
                       (config.provider === 'openrouter' 
                         ? 'https://openrouter.ai/api/v1/chat/completions'
                         : 'https://api.openai.com/v1/chat/completions');
    
    console.log('API endpoint:', apiEndpoint);
    
    // Prepare headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    };
    
    // Add OpenRouter-specific headers
    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = window.location.origin;
      headers['X-Title'] = 'Easy Lunch Chat';
    }
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        model: modelToUse || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful customer service assistant for Easy Lunch, a restaurant. Be friendly and concise. Keep responses under 80 words.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: config.maxTokens || 100,
        temperature: 0.7
      })
    });

    console.log('AI response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('AI API error:', response.status, errorData);
      
      // Try fallback models if rate limited
      if (response.status === 429 && config.fallbackModels && !modelOverride) {
        console.log('Rate limited, trying fallback models...');
        for (const fallbackModel of config.fallbackModels) {
          console.log('Trying fallback model:', fallbackModel);
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return await window.sendMessageToOpenAI(message, fallbackModel);
          } catch (fallbackError) {
            console.error('Fallback model failed:', fallbackModel, fallbackError);
            continue;
          }
        }
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('AI response:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from AI');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('sendMessageToOpenAI error:', error);
    throw error;
  }
};
