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

    function botReply(userText) {
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


