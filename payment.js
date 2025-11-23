// ========== COMPLETE CART & PAYMENT SYSTEM WITH FIREBASE ==========
// Combines localStorage cart management with multi-payment support and Firebase real-time sync

(function() {
  const CART_KEY = 'easy_lunch_cart_v1';
  const ORDERS_KEY = 'easy_lunch_orders_v1';
  // Optional: If a PayMongo Checkout Link is provided, we'll use it for GCash
  const PAYMONGO_CHECKOUT_LINK = 'https://pm.link/org-YYuT3fHYmvyjQQJi7X2PTu1Z/Mdw4Spr';

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
      onApprove: async function(data, actions) {
        const details = await actions.order.capture();
        await completeOrder('paypal', details.id, details);
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
    
    const orderData = {
      orderId: 'EL' + Date.now(),
      timestamp: new Date().toISOString(),
      customer: {
        fullName: inputs[0]?.value?.trim() || '',
        address: inputs[1]?.value?.trim() || '',
        contact: inputs[2]?.value?.trim() || '',
        email: inputs[3]?.value?.trim() || ''
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
      status: 'pending'
    };
    
    return orderData;
  }

  async function saveOrderToFirebase(orderData) {
    try {
      // Use the centralized Firestore order creation function
      if(typeof window.createFirestoreOrder === 'function') {
        console.log('💾 Saving order to Firestore...');
        
        // Transform orderData to match createFirestoreOrder's expected format
        const transformedData = {
          customerName: orderData.customer?.fullName || '',
          email: orderData.customer?.email || '',
          phone: orderData.customer?.contact || '',
          address: orderData.customer?.address || '',
          items: orderData.items || [],
          total: orderData.totals?.total || 0,
          subtotal: orderData.totals?.subtotal || 0,
          deliveryFee: orderData.totals?.deliveryFee || 30,
          discount: orderData.totals?.discount || 0,
          paymentMethod: orderData.payment?.method || 'Cash on Delivery',
          paymentReference: orderData.payment?.reference || '',
          notes: orderData.notes || ''
        };
        
        const docId = await window.createFirestoreOrder(transformedData);
        console.log('✅ Order saved to Firestore:', docId);
        return { success: true, id: docId };
      } else {
        console.warn('⚠️ createFirestoreOrder not available, using fallback');
        // Fallback to direct Firestore if function not loaded
        if(typeof firebase !== 'undefined' && firebase.firestore) {
          const db = firebase.firestore();
          const docRef = await db.collection('orders').add(orderData);
          console.log('✅ Order saved to Firestore (fallback):', docRef.id);
          return { success: true, id: docRef.id };
        }
      }
    } catch(e) {
      console.error('❌ Firebase save error:', e);
    }
    return { success: false };
  }

  function saveOrderToLocalStorage(orderData) {
    try {
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      orders.unshift(orderData);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
      
      // Trigger custom event for same-tab listeners
      window.dispatchEvent(new Event('orders-updated'));
      
      return { success: true };
    } catch(e) {
      console.error('LocalStorage save error:', e);
      return { success: false };
    }
  }

  async function completeOrder(paymentMethod, reference = null, details = null) {
    const orderData = getOrderData(paymentMethod, reference);
    
    // Save to Firebase first and get the document ID
    const firebaseResult = await saveOrderToFirebase(orderData);
    if(firebaseResult.success) {
      // Store the Firestore document ID in the order data
      orderData.id = firebaseResult.id;
      orderData.firebaseId = firebaseResult.id;
      console.log('📝 Order saved with Firestore ID:', firebaseResult.id);
    } else {
      console.warn('⚠️ Firebase save failed, order will only be in localStorage');
    }
    
    // Save to localStorage as backup
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
      
        // Automatically mark order as completed in Firestore
        if(orderData.id && window.updateFirestoreOrderStatus) {
          window.updateFirestoreOrderStatus(orderData.id, 'completed')
            .then(() => {
              console.log('✅ Order automatically marked as completed in Firestore:', orderData.id);
            })
            .catch((err) => {
              console.error('❌ Error auto-marking order as completed:', err);
            });
        }
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
    
    placeOrderBtn.addEventListener('click', async function() {
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
      
      // Validate delivery info
      if(!fullName || !address || !contact) {
        alert('Please complete your delivery information.');
        return;
      }
      
      // Get selected payment method
      const methodRadios = document.querySelectorAll('input[name="payMethod"]');
      const selectedMethod = Array.from(methodRadios).find(r => r.checked);
      
      if(!selectedMethod) {
        alert('Please select a payment method.');
        return;
      }
      
      const method = selectedMethod.value;
      
      // Handle different payment methods
      if(method === 'gcash') {
        // Legacy manual reference flow (if input present)
        const gcashRefInput = document.getElementById('gcashRef');
        if(gcashRefInput && gcashRefInput.value.trim()) {
          await completeOrder('gcash', gcashRefInput.value.trim());
        } else if(paymongoBtn) {
          // Encourage using secure flow
          alert('Use the "Pay with GCash (Secure)" button to proceed with online payment.');
          return;
        } else {
          alert('GCash reference required or use secure payment button.');
          return;
        }
      } else if(method === 'bank') {
        const bankRef = document.getElementById('bankRef')?.value?.trim();
        if(!bankRef) {
          alert('Please enter your Bank Transfer Reference Number.');
          return;
        }
        await completeOrder('bank', bankRef);
      } else if(method === 'cod') {
        await completeOrder('cod');
      } else if(method === 'paypal') {
        alert('Please use the PayPal button below to complete payment.');
      }
    });
  }

  // ========== INITIALIZATION ==========
  document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    initPaymentMethods();
    initCheckout();

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
            await completeOrder('gcash_paymongo', intentId);
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

