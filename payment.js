// ========== COMPLETE CART & PAYMENT SYSTEM WITH FIREBASE ==========
// Combines localStorage cart management with multi-payment support and Firebase real-time sync

(function() {
  // Check Firebase availability on load
  console.log('💳 Payment.js loading...');
  console.log('🔥 Firebase available:', typeof firebase !== 'undefined');
  console.log('📦 Firestore available:', typeof firebase !== 'undefined' && typeof firebase.firestore !== 'undefined');
  console.log('🔐 Auth available:', typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined');
  
  const CART_KEY = 'easy_lunch_cart_v1';
  const ORDERS_KEY = 'easy_lunch_orders_v1';
  // Optional: If a PayMongo Checkout Link is provided, we'll use it for GCash
  const PAYMONGO_CHECKOUT_LINK = 'https://pm.link/org-YYuT3fHYmvyjQQJi7X2PTu1Z/Mdw4Spr';
  
  // Backend URL for order notifications (auto-detects localhost vs production)
  const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : window.location.origin;

  // ========== CART MANAGEMENT ==========
  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch(e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function clearCart() {
    localStorage.removeItem(CART_KEY);
  }

  function addToCart(item) {
    const cart = loadCart();
    const found = cart.find(i => i.name === item.name);
    if(found) {
      found.quantity = (found.quantity || 1) + (item.quantity || 1);
    } else {
      cart.push({...item, quantity: item.quantity || 1});
    }
    saveCart(cart);
    renderCart();
    showCartNotification(item.name);
  }

  function showCartNotification(itemName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 12rem;
      right: 3rem;
      background: #4CAF50;
      color: white;
      padding: 1.5rem 2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10001;
      animation: slideIn 0.3s ease;
      font-size: 1.4rem;
    `;
    notification.innerHTML = `✓ ${itemName} added to cart`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // ========== CART RENDERING ==========
  function renderCart() {
    const container = document.getElementById('cartItemsContainer');
    if(!container) return;
    
    const cart = loadCart();
    container.innerHTML = '';
    
    if(cart.length === 0) {
      container.innerHTML = '<p style="text-align: center; padding: 3rem; color: #6e6e6e; font-size: 1.6rem;">Your cart is empty.</p>';
      updateTotals(0, 0, 0);
      return;
    }
    
    let subtotal = 0;
    cart.forEach((item, idx) => {
      subtotal += item.price * (item.quantity || 1);
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.img}" alt="${item.name}">
        <div class="cart-details">
          <h3>${item.name}</h3>
          <div class="quantity-control">
            <button class="dec" data-i="${idx}">-</button>
            <span>${item.quantity || 1}</span>
            <button class="inc" data-i="${idx}">+</button>
          </div>
        </div>
        <p class="item-price">₱${(item.price * (item.quantity || 1)).toFixed(2)}</p>
        <button class="delete-item" data-i="${idx}">🗑️</button>
      `;
      container.appendChild(row);
    });
    
    const deliveryFee = 30;
    const discount = 0;
    updateTotals(subtotal, deliveryFee, discount);
  }

  function updateTotals(subtotal, deliveryFee, discount) {
    const total = subtotal + deliveryFee - discount;
    
    const subtotalEls = document.querySelectorAll('.summary-line:nth-child(1) span:last-child, .summary-line span:last-child');
    const deliveryEls = document.querySelectorAll('.summary-line:nth-child(3) span:last-child');
    const totalEls = document.querySelectorAll('.summary-total span:last-child');
    
    document.querySelectorAll('.summary-line').forEach(line => {
      if(line.textContent.includes('Subtotal')) {
        line.querySelector('span:last-child').textContent = `₱${subtotal.toFixed(2)}`;
      }
      if(line.textContent.includes('Delivery')) {
        line.querySelector('span:last-child').textContent = `₱${deliveryFee.toFixed(2)}`;
      }
    });
    
    totalEls.forEach(el => el.textContent = `₱${total.toFixed(2)}`);
    
    return { subtotal, deliveryFee, discount, total };
  }

  // ========== CART EVENT HANDLERS ==========
  document.addEventListener('click', function(e) {
    const target = e.target;
    
    // Add to cart button
    if(target.matches('.add-to-cart') || target.matches('.add-to-cart-popup')) {
      const card = target.closest('.product-card') || target.closest('.popup-content-new');
      if(!card) return;
      
      let item;
      if(card.dataset.name && card.dataset.price) {
        // Use dataset if available
        item = {
          name: card.dataset.name,
          price: parseFloat(card.dataset.price),
          img: card.dataset.img || '',
          quantity: 1
        };
      } else {
        // Fallback to DOM elements
        const nameEl = card.querySelector('.product-name') || card.querySelector('#popup-title');
        const priceEl = card.querySelector('.product-price') || card.querySelector('#popup-price');
        const imgEl = card.querySelector('.product-image') || card.querySelector('#popup-img');
        
        item = {
          name: nameEl ? nameEl.textContent.trim() : 'Product',
          price: parseFloat((priceEl ? priceEl.textContent : '0').replace(/[^\d.]/g, '')),
          img: imgEl ? imgEl.src : '',
          quantity: 1
        };
      }
      
      addToCart(item);
      return;
    }
    
    // Quantity controls
    if(target.matches('.inc') || target.matches('.dec') || target.matches('.delete-item')) {
      const idx = parseInt(target.dataset.i, 10);
      const cart = loadCart();
      
      if(isNaN(idx) || !cart[idx]) return;
      
      if(target.matches('.inc')) {
        cart[idx].quantity = (cart[idx].quantity || 1) + 1;
      } else if(target.matches('.dec')) {
        cart[idx].quantity = Math.max(1, (cart[idx].quantity || 1) - 1);
      } else if(target.matches('.delete-item')) {
        cart.splice(idx, 1);
      }
      
      saveCart(cart);
      renderCart();
      return;
    }
  });

  // Listen for addToCart custom event (for recommendations)
  document.addEventListener('addToCart', function(e) {
    if (e.detail) {
      addToCart(e.detail);
    }
  });

  // ========== PAYMENT METHOD SWITCHING ==========
  function initPaymentMethods() {
    const methodRadios = document.querySelectorAll('input[name="payMethod"]');
    if(!methodRadios.length) return;
    
    const sections = {
      gcash: document.getElementById('payGCash'),
      bank: document.getElementById('payBank'),
      cod: document.getElementById('payCOD'),
      paypal: document.getElementById('payPaypal')
    };
    
    function showMethod(value) {
      Object.keys(sections).forEach(key => {
        if(sections[key]) {
          sections[key].style.display = key === value ? 'block' : 'none';
        }
      });
      
      if(value === 'paypal') {
        renderPayPalButtons();
      }
    }
    
    methodRadios.forEach(radio => {
      radio.addEventListener('change', () => showMethod(radio.value));
    });
    
    const checked = Array.from(methodRadios).find(r => r.checked);
    if(checked) showMethod(checked.value);
  }

  // ========== PAYPAL INTEGRATION ==========
  let paypalRendered = false;
  
  function renderPayPalButtons() {
    const container = document.getElementById('paypalButtons');
    if(!container || paypalRendered) return;
    
    container.innerHTML = '';
    
    if(typeof paypal === 'undefined') {
      container.innerHTML = '<p style="color: #c0392b; text-align: center;">PayPal SDK not loaded</p>';
      return;
    }
    
    const cart = loadCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const total = subtotal + 30;
    
    paypal.Buttons({
      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: total.toFixed(2),
              currency_code: 'PHP'
            }
          }]
        });
      },
      onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
          completeOrder('paypal', details.id, details);
        });
      },
      onError: function(err) {
        console.error('PayPal error:', err);
        alert('Payment failed. Please try again.');
      }
    }).render('#paypalButtons');
    
    paypalRendered = true;
  }

  // ========== ORDER COMPLETION WITH FIREBASE ==========
  function getOrderData(paymentMethod, reference = null) {
    const cart = loadCart();
    const inputs = document.querySelectorAll('.checkout-section input');
    
    // Get current user from Firebase Auth
    let userUid = null, userEmail = '';
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
      userUid = firebase.auth().currentUser.uid;
      userEmail = firebase.auth().currentUser.email;
    }
    // Create timestamp - prefer Firestore Timestamp for proper ordering
    let timestamp;
    try {
      timestamp = typeof firebase !== 'undefined' && firebase.firestore ? 
        firebase.firestore.Timestamp.now() : 
        new Date().toISOString();
    } catch(e) {
      console.warn('⚠️ Firestore not available, using ISO string timestamp');
      timestamp = new Date().toISOString();
    }
    
    const orderData = {
      orderId: 'EL' + Date.now(),
      timestamp: timestamp, // Firestore Timestamp for proper sorting (or ISO string fallback)
      created_at: new Date().toISOString(), // Keep ISO string for display/compatibility
      customer: {
        fullName: inputs[0]?.value?.trim() || '',
        address: inputs[1]?.value?.trim() || '',
        contact: inputs[2]?.value?.trim() || '',
        email: inputs[3]?.value?.trim() || userEmail
      },
      items: cart,
      totals: {
        subtotal: cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0),
        deliveryFee: 30,
        discount: 0,
        total: cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) + 30
      },
      payment: {
        method: paymentMethod,
        reference: reference,
        status: paymentMethod === 'paypal' ? 'paid' : (paymentMethod === 'cod' ? 'pending' : 'awaiting_verification')
      },
      status: 'pending',
      userUid,
      userEmail
    };
    return orderData;
  }

  async function saveOrderToFirebase(orderData) {
    try {
      // Check if Firebase is loaded
      if(typeof firebase === 'undefined') {
        console.error('❌ Firebase not loaded!');
        return { success: false, error: 'Firebase not loaded' };
      }
      
      if(!firebase.firestore) {
        console.error('❌ Firestore not initialized!');
        return { success: false, error: 'Firestore not initialized' };
      }
      
      // Check if user is authenticated
      const user = firebase.auth().currentUser;
      if(!user) {
        console.error('❌ User not authenticated! Cannot save order to Firestore.');
        return { success: false, error: 'User not authenticated' };
      }
      
      const db = firebase.firestore();
      console.log('🔄 Saving order to Firestore...');
      console.log('📦 Order data:', {
        orderId: orderData.orderId,
        userEmail: orderData.userEmail,
        userUid: orderData.userUid,
        total: orderData.totals?.total,
        itemCount: orderData.items?.length
      });
      
      // Create document ID that sorts newest first in Firebase Console
      // Use reverse date format (YYYYMMDD becomes subtracted from 99999999) for descending order
      // Then add reverse timestamp within the day
      // Format: [REVERSE_DATE]_[REVERSE_TIME]_[ORDER_ID]
      // This ensures newest orders appear first, even with old random-ID orders present
      const now = new Date();
      const dateNum = parseInt(now.getFullYear().toString() + 
                              (now.getMonth() + 1).toString().padStart(2, '0') + 
                              now.getDate().toString().padStart(2, '0'));
      const reverseDate = (99999999 - dateNum).toString();
      const timestamp = Date.now();
      const reverseTime = (9999999999999 - timestamp).toString().padStart(13, '0');
      const documentId = `${reverseDate}_${reverseTime}_${orderData.orderId}`;
      
      await db.collection('orders').doc(documentId).set(orderData);
      console.log('✅ Order saved to Firestore successfully!');
      console.log('📄 Document ID:', documentId);
      console.log('🔗 View in Firebase Console: https://console.firebase.google.com/project/easy-lunch-368cf/firestore/data/orders/' + documentId);
      
      return { success: true, id: documentId };
    } catch(e) {
      console.error('❌ Firebase save error:', e);
      console.error('Error code:', e.code);
      console.error('Error message:', e.message);
      
      // Show user-friendly error
      if(e.code === 'permission-denied') {
        alert(`⚠️ Permission denied: Please make sure you're logged in.\nOrder saved locally for now.`);
      } else {
        alert(`⚠️ Order saved locally but couldn't sync to database: ${e.message}\nYour order is still recorded!`);
      }
      
      return { success: false, error: e.message };
    }
  }

  // Send COD order notification to backend
  async function sendCODOrderEmail(orderData) {
    try {
      const response = await fetch(`${BACKEND_URL}/order/cod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderData.orderId,
          customer: orderData.customer,
          amount: orderData.totals.total,
          items: orderData.items
        })
      });
      
      if (response.ok) {
        console.log('COD order notification sent successfully');
      } else {
        console.error('Failed to send COD order notification:', await response.text());
      }
    } catch (error) {
      console.error('Error sending COD order notification:', error);
    }
  }

  function saveOrderToLocalStorage(orderData) {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      orders.unshift(orderData);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      
      // Trigger custom event for same-tab listeners
      window.dispatchEvent(new Event('orders-updated'));
      // If account page is open, reload order history
      if (window.loadUserOrders) {
        try { window.loadUserOrders({ email: orderData.userEmail, uid: orderData.userUid }); } catch(e) {}
      }
      
      return { success: true };
    } catch(e) {
      console.error('LocalStorage save error:', e);
      return { success: false };
    }
  }

  function completeOrder(paymentMethod, reference = null, details = null) {
    const orderData = getOrderData(paymentMethod, reference);
    
    // Send email notification for COD orders
    if (paymentMethod === 'cod') {
      sendCODOrderEmail(orderData);
    }
    
    // Save to both Firebase and localStorage
    saveOrderToFirebase(orderData).then(result => {
      if(result.success) {
        orderData.firebaseId = result.id;
      }
      // Debug log: show orderData after saving
      console.log('Order placed:', orderData);
      // If account page is open, reload order history
      if (window.loadUserOrders) {
        try { window.loadUserOrders({ email: orderData.userEmail, uid: orderData.userUid }); } catch(e) { console.error('Order history reload error:', e); }
      }
    });

    saveOrderToLocalStorage(orderData);

    // Clear cart
    clearCart();
    renderCart();

    // Close checkout modal
    const checkoutModal = document.getElementById('checkoutModal');
    if(checkoutModal) {
      checkoutModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }

    // Show confirmation modal
    const confirmationModal = document.getElementById('confirmationModal');
    if(confirmationModal) {
      confirmationModal.style.display = 'flex';

      // Update order info
      const orderInfoBar = confirmationModal.querySelector('.order-info-bar');
      if(orderInfoBar) {
        // Clear existing dynamic info
        const dynamicInfo = orderInfoBar.querySelectorAll('div:not(:first-child):not(:last-child)');
        dynamicInfo.forEach(el => el.remove());

        // Add payment info
        const paymentDiv = document.createElement('div');
        paymentDiv.innerHTML = `<strong>Payment:</strong> ${paymentMethod.toUpperCase()}`;
        orderInfoBar.insertBefore(paymentDiv, orderInfoBar.lastElementChild);

        if(reference) {
          const refDiv = document.createElement('div');
          refDiv.innerHTML = `<strong>Ref:</strong> ${reference}`;
          orderInfoBar.insertBefore(refDiv, orderInfoBar.lastElementChild);
        }

        // Update order ID
        const orderIdDiv = orderInfoBar.querySelector('div:first-child');
        if(orderIdDiv) {
          orderIdDiv.innerHTML = `<strong>Order ID:</strong> ${orderData.orderId}`;
        }
      }

      // Update order items
      updateConfirmationItems(orderData.items, orderData.totals);
    }
  }

  function updateConfirmationItems(items, totals) {
    const orderDetailsContainer = document.querySelector('.order-details');
    if(!orderDetailsContainer) return;
    
    const itemsHTML = items.map(item => `
      <div class="order-item">
        <img src="${item.img}" alt="${item.name}">
        <div>
          <p><strong>${item.name}</strong></p>
          <p class="desc">Quantity: ${item.quantity || 1}</p>
        </div>
        <span class="price">₱${(item.price * (item.quantity || 1)).toFixed(2)}</span>
      </div>
    `).join('');
    
    // Clear existing items
    const existingItems = orderDetailsContainer.querySelectorAll('.order-item');
    existingItems.forEach(el => el.remove());
    
    // Insert new items after h4
    const itemsSection = orderDetailsContainer.querySelector('h4');
    if(itemsSection) {
      itemsSection.insertAdjacentHTML('afterend', itemsHTML);
    }
    
    // Update totals
    const summaryBottom = document.querySelector('.order-summary-bottom');
    if(summaryBottom && totals) {
      summaryBottom.querySelector('.summary-line:nth-child(1) span:last-child').textContent = `₱${totals.subtotal.toFixed(2)}`;
      summaryBottom.querySelector('.summary-line:nth-child(2) span:last-child').textContent = `₱${totals.deliveryFee.toFixed(2)}`;
      summaryBottom.querySelector('.summary-line:nth-child(3) span:last-child').textContent = `-₱${totals.discount.toFixed(2)}`;
      summaryBottom.querySelector('.summary-total span:last-child').textContent = `₱${totals.total.toFixed(2)}`;
    }
  }

  // ========== CHECKOUT AUTHENTICATION CHECK ==========
  function checkAuthBeforeCheckout() {
    // Check if user is signed in
    if (!firebase || !firebase.auth || !firebase.auth().currentUser) {
      alert('You must be signed in to checkout. Please sign in or create an account.');
      // Open auth modal if available
      if (window.SimpleAuth && window.SimpleAuth.openSignIn) {
        window.SimpleAuth.openSignIn();
      } else if (window.openAuthModal) {
        window.openAuthModal();
      } else if (typeof openAuthModal === 'function') {
        openAuthModal();
      } else {
        window.location.href = 'login.html';
      }
      return false;
    }
    
    // Check if email is verified
    const currentUser = firebase.auth().currentUser;
    if (!currentUser.emailVerified) {
      const shouldVerify = confirm('Your email is not verified yet. Please verify your email to checkout for security purposes. Check your inbox or click OK to resend verification email.');
      if (shouldVerify) {
        currentUser.sendEmailVerification()
          .then(() => {
            alert('Verification email sent! Please check your inbox and verify your email, then refresh this page.');
          })
          .catch((error) => {
            console.error('Error sending verification email:', error);
            alert('Error sending verification email. Please go to your account page to resend.');
          });
      }
      return false;
    }
    
    return true;
  }

  // ========== PLACE ORDER HANDLER ==========
  function initCheckout() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const paymongoBtn = document.getElementById('paymongoGcashBtn');
    const BACKEND_URL = window.PAYMONGO_BACKEND_URL || 'http://localhost:3000';

    async function initiatePayMongoGcash() {
      // If a checkout link is configured, open it directly
      if (PAYMONGO_CHECKOUT_LINK) {
        // Basic validation to ensure user filled delivery info
        const inputs = document.querySelectorAll('.checkout-section input');
        const fullName = inputs[0]?.value?.trim();
        const address = inputs[1]?.value?.trim();
        const contact = inputs[2]?.value?.trim();
        if(!fullName || !address || !contact) {
          alert('Please complete your delivery information first.');
          return;
        }
        try {
          paymongoBtn.disabled = true;
          paymongoBtn.textContent = 'Opening GCash Checkout...';
          // Open in a new tab to preserve the cart context in current tab
          window.open(PAYMONGO_CHECKOUT_LINK, '_blank', 'noopener');
        } finally {
          setTimeout(() => {
            paymongoBtn.disabled = false;
            paymongoBtn.textContent = 'Pay with GCash (Checkout Link)';
          }, 1200);
        }
        return;
      }
      // Fallback to backend-driven secure flow (if needed)
      const cart = loadCart();
      if(cart.length === 0) {
        alert('Cart is empty.');
        return;
      }
      const inputs = document.querySelectorAll('.checkout-section input');
      const fullName = inputs[0]?.value?.trim();
      const address = inputs[1]?.value?.trim();
      const contact = inputs[2]?.value?.trim();
      if(!fullName || !address || !contact) {
        alert('Please complete your delivery information first.');
        return;
      }
      const subtotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      const total = subtotal + 30; // delivery fee
      const orderId = 'EL' + Date.now();
      try {
        paymongoBtn.disabled = true;
        paymongoBtn.textContent = 'Redirecting to GCash...';
        const resp = await fetch(BACKEND_URL + '/paymongo/gcash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total, orderId, customer: { name: fullName, email: '', phone: contact } })
        });
        if(!resp.ok) {
          const err = await resp.json().catch(()=>({}));
          throw new Error(err.error || 'Request failed');
        }
        const data = await resp.json();
        const pendingOrder = getOrderData('gcash_paymongo');
        pendingOrder.orderId = orderId;
        pendingOrder.payment.status = 'pending_redirect';
        saveOrderToLocalStorage(pendingOrder);
        window.location.href = data.redirectUrl;
      } catch(e) {
        console.error('PayMongo GCash init error:', e);
        alert('Failed to start GCash payment: ' + e.message);
        paymongoBtn.disabled = false;
        paymongoBtn.textContent = 'Pay with GCash (Secure)';
      }
    }
    if(paymongoBtn) {
      paymongoBtn.addEventListener('click', initiatePayMongoGcash);
    }
    
    if(!placeOrderBtn) return;
    
    placeOrderBtn.addEventListener('click', function(e) {
      // Prevent default behavior
      e.preventDefault();
      
      // Check authentication and phone verification first
      if (!checkAuthBeforeCheckout()) {
        return;
      }
      
      // Double-check cart isn't empty
      const cart = loadCart();
      if(cart.length === 0) {
        alert('Your cart is empty! Please add items before placing an order.');
        return;
      }
      
      const inputs = document.querySelectorAll('.checkout-section input');
      const fullName = inputs[0]?.value?.trim();
      const address = inputs[1]?.value?.trim();
      const contact = inputs[2]?.value?.trim();
      
      // Strict validation for delivery info with specific error messages
      if(!fullName || fullName.length < 2) {
        alert('Please enter your full name (at least 2 characters).');
        inputs[0]?.focus();
        return;
      }
      
      if(!address || address.length < 10) {
        alert('Please enter a complete delivery address (at least 10 characters).');
        inputs[1]?.focus();
        return;
      }
      
      if(!contact || contact.length < 10) {
        alert('Please enter a valid contact number (at least 10 digits).');
        inputs[2]?.focus();
        return;
      }
      
      // Validate contact number format (must contain numbers)
      const contactDigits = contact.replace(/\D/g, '');
      if(contactDigits.length < 10) {
        alert('Please enter a valid contact number with at least 10 digits.');
        inputs[2]?.focus();
        return;
      }
      
      // Get selected payment method
      const methodRadios = document.querySelectorAll('input[name="payMethod"]');
      const selectedMethod = Array.from(methodRadios).find(r => r.checked);
      
      if(!selectedMethod) {
        alert('Please select a payment method before placing your order.');
        return;
      }
      
      const method = selectedMethod.value;
      
      // Handle different payment methods with strict validation
      if(method === 'gcash') {
        // Legacy manual reference flow (if input present)
        const gcashRefInput = document.getElementById('gcashRef');
        const gcashRefValue = gcashRefInput?.value?.trim();
        
        if(gcashRefValue && gcashRefValue.length >= 6) {
          completeOrder('gcash', gcashRefValue);
        } else if(paymongoBtn) {
          // Encourage using secure flow
          alert('Use the "Pay with GCash (Secure)" button to proceed with online payment.');
          return;
        } else {
          alert('GCash reference number required (at least 6 characters) or use secure payment button.');
          gcashRefInput?.focus();
          return;
        }
      } else if(method === 'bank') {
        const bankRefInput = document.getElementById('bankRef');
        const bankRef = bankRefInput?.value?.trim();
        
        if(!bankRef || bankRef.length < 6) {
          alert('Please enter a valid Bank Transfer Reference Number (at least 6 characters).');
          bankRefInput?.focus();
          return;
        }
        completeOrder('bank', bankRef);
      } else if(method === 'cod') {
        // COD requires no additional fields but confirm the order
        completeOrder('cod');
      } else if(method === 'paypal') {
        alert('Please use the PayPal button below to complete payment.');
        return;
      } else {
        alert('Invalid payment method selected. Please choose a valid payment option.');
        return;
      }
    });
  }

  // ========== REAL-TIME VALIDATION ==========
  function addInputValidation() {
    const inputs = document.querySelectorAll('.checkout-section input[type="text"]');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    
    // Add validation styling
    const style = document.createElement('style');
    style.textContent = `
      .checkout-section input.invalid {
        border-color: #e74c3c !important;
        background-color: #fee !important;
      }
      .checkout-section input.valid {
        border-color: #27ae60 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Validate individual input
    function validateInput(input, index) {
      const value = input.value.trim();
      let isValid = false;
      
      if(index === 0) { // Full Name
        isValid = value.length >= 2;
      } else if(index === 1) { // Address
        isValid = value.length >= 10;
      } else if(index === 2) { // Contact
        const digits = value.replace(/\D/g, '');
        isValid = digits.length >= 10;
      }
      
      if(value.length > 0) {
        input.classList.toggle('invalid', !isValid);
        input.classList.toggle('valid', isValid);
      } else {
        input.classList.remove('invalid', 'valid');
      }
      
      return isValid;
    }
    
    // Validate all inputs
    function validateAllInputs() {
      let allValid = true;
      inputs.forEach((input, index) => {
        if(!validateInput(input, index)) {
          allValid = false;
        }
      });
      return allValid;
    }
    
    // Add input listeners
    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        validateInput(input, index);
      });
      
      input.addEventListener('blur', () => {
        if(input.value.trim().length > 0) {
          validateInput(input, index);
        }
      });
    });
  }

  // ========== INITIALIZATION ==========
  document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    initPaymentMethods();
    initCheckout();
    addInputValidation();

    // If returning from PayMongo (GCash) redirect
    const urlParams = new URLSearchParams(window.location.search);
    const intentId = urlParams.get('intent');
    const orderIdFromReturn = urlParams.get('orderId');
    const BACKEND_URL = window.PAYMONGO_BACKEND_URL || 'http://localhost:3000';
    if(intentId) {
      const statusCheck = async () => {
        try {
          const r = await fetch(BACKEND_URL + '/paymongo/intent/' + intentId);
          const j = await r.json();
          if(j.status === 'succeeded') {
            // Mark order as paid
            completeOrder('gcash_paymongo', intentId);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if(['processing','awaiting_payment_method','awaiting_next_action'].includes(j.status)) {
            setTimeout(statusCheck, 2500);
          } else {
            console.warn('Unexpected intent status:', j.status);
            alert('Payment status: ' + j.status + '. If paid, it will update soon.');
          }
        } catch(e) {
          console.error('Polling error:', e);
          setTimeout(statusCheck, 4000);
        }
      };
      statusCheck();
    }
    
    // Reset PayPal rendered flag when checkout modal opens
    const checkoutBtn = document.getElementById('checkoutBtn');
    if(checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        // Check if user is logged in
        if(typeof firebase !== 'undefined' && firebase.auth) {
          const user = firebase.auth().currentUser;
          if(!user) {
            // User not logged in - open auth modal
            alert('🔒 Please log in to place an order');
            
            // Close cart modal first
            const cartModal = document.getElementById('cartModal');
            if(cartModal) {
              cartModal.style.display = 'none';
              document.body.style.overflow = 'auto';
            }
            
            // Open auth modal (from auth.js)
            if(window.EasyLunchAuth && window.EasyLunchAuth.openSignIn) {
              window.EasyLunchAuth.openSignIn();
            } else {
              console.error('Auth modal not available');
              // Fallback: show message
              alert('Please log in using the user icon in the navigation bar');
            }
            return;
          }
        }
        paypalRendered = false;
      });
    }
    
    // Close confirmation modal
    const closeConfirmation = document.getElementById('closeConfirmation');
    if(closeConfirmation) {
      closeConfirmation.addEventListener('click', function() {
        const modal = document.getElementById('confirmationModal');
        if(modal) {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
        }
      });
    }
  });
})();

