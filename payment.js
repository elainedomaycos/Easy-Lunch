// ========== COMPLETE CART & PAYMENT SYSTEM ==========
// Combines localStorage cart management with multi-payment support

(function() {
  const CART_KEY = 'easy_lunch_cart_v1';

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
      found.qty += 1;
    } else {
      cart.push(item);
    }
    saveCart(cart);
    renderCart();
    showCartNotification(item.name);
  }

  function showCartNotification(itemName) {
    // Create a simple notification
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
      subtotal += item.price * item.qty;
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${item.img}" alt="${item.name}">
        <div class="cart-details">
          <h3>${item.name}</h3>
          <div class="quantity-control">
            <button class="dec" data-i="${idx}">-</button>
            <span>${item.qty}</span>
            <button class="inc" data-i="${idx}">+</button>
          </div>
        </div>
        <p class="item-price">₱${(item.price * item.qty).toFixed(2)}</p>
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
    
    // Update cart modal totals
    const subtotalEls = document.querySelectorAll('.summary-line:nth-child(1) span:last-child');
    const deliveryEls = document.querySelectorAll('.summary-line:nth-child(3) span:last-child');
    const totalEls = document.querySelectorAll('.summary-total span:last-child');
    
    subtotalEls.forEach(el => el.textContent = `₱${subtotal.toFixed(2)}`);
    deliveryEls.forEach(el => el.textContent = `₱${deliveryFee.toFixed(2)}`);
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
      
      const item = {
        name: card.querySelector('.product-name')?.textContent || card.querySelector('#popup-title')?.textContent || 'Product',
        price: parseFloat((card.querySelector('.product-price')?.textContent || card.querySelector('#popup-price')?.textContent || '0').replace(/[^\d.]/g,'')),
        img: card.querySelector('.product-image')?.src || card.querySelector('#popup-img')?.src || '',
        qty: 1
      };
      
      addToCart(item);
      return;
    }
    
    // Quantity controls
    if(target.matches('.inc') || target.matches('.dec') || target.matches('.delete-item')) {
      const idx = parseInt(target.dataset.i, 10);
      const cart = loadCart();
      
      if(isNaN(idx) || !cart[idx]) return;
      
      if(target.matches('.inc')) {
        cart[idx].qty += 1;
      } else if(target.matches('.dec')) {
        cart[idx].qty = Math.max(1, cart[idx].qty - 1);
      } else if(target.matches('.delete-item')) {
        cart.splice(idx, 1);
      }
      
      saveCart(cart);
      renderCart();
      return;
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
    
    // Initialize with default checked
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = subtotal + 30; // Add delivery fee
    
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

  // ========== ORDER COMPLETION ==========
  function getOrderData(paymentMethod, reference = null) {
    const cart = loadCart();
    const inputs = document.querySelectorAll('.checkout-section input');
    
    const orderData = {
      orderId: 'EL' + Date.now(),
      timestamp: new Date().toISOString(),
      customer: {
        fullName: inputs[0]?.value?.trim() || '',
        address: inputs[1]?.value?.trim() || '',
        contact: inputs[2]?.value?.trim() || ''
      },
      items: cart,
      totals: {
        subtotal: cart.reduce((sum, item) => sum + (item.price * item.qty), 0),
        deliveryFee: 30,
        discount: 0,
        total: cart.reduce((sum, item) => sum + (item.price * item.qty), 0) + 30
      },
      payment: {
        method: paymentMethod,
        reference: reference,
        status: paymentMethod === 'paypal' ? 'paid' : (paymentMethod === 'cod' ? 'pending' : 'awaiting_verification')
      },
      status: 'placed'
    };
    
    return orderData;
  }

  async function saveOrderToFirebase(orderData) {
    try {
      if(typeof firebase !== 'undefined' && firebase.firestore) {
        const db = firebase.firestore();
        const docRef = await db.collection('orders').add(orderData);
        return { success: true, id: docRef.id };
      }
    } catch(e) {
      console.error('Firebase save error:', e);
    }
    return { success: false };
  }

  function completeOrder(paymentMethod, reference = null, details = null) {
    const orderData = getOrderData(paymentMethod, reference);
    
    // Save to Firebase if available
    saveOrderToFirebase(orderData).then(result => {
      if(result.success) {
        orderData.firebaseId = result.id;
      }
    });
    
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
        const paymentInfo = document.createElement('div');
        paymentInfo.innerHTML = `<strong>Payment:</strong> ${paymentMethod.toUpperCase()}`;
        orderInfoBar.appendChild(paymentInfo);
        
        if(reference) {
          const refInfo = document.createElement('div');
          refInfo.innerHTML = `<strong>Ref:</strong> ${reference}`;
          orderInfoBar.appendChild(refInfo);
        }
      }
      
      // Update order items in confirmation
      updateConfirmationItems(orderData.items);
    }
  }

  function updateConfirmationItems(items) {
    const orderDetailsContainer = document.querySelector('.order-details');
    if(!orderDetailsContainer) return;
    
    const itemsHTML = items.map(item => `
      <div class="order-item">
        <img src="${item.img}" alt="${item.name}">
        <div>
          <p><strong>${item.name}</strong></p>
          <p class="desc">Quantity: ${item.qty}</p>
        </div>
        <span class="price">₱${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `).join('');
    
    const itemsSection = orderDetailsContainer.querySelector('h4');
    if(itemsSection) {
      // Clear existing items
      const existingItems = orderDetailsContainer.querySelectorAll('.order-item');
      existingItems.forEach(el => el.remove());
      
      // Insert new items after h4
      itemsSection.insertAdjacentHTML('afterend', itemsHTML);
    }
  }

  // ========== PLACE ORDER HANDLER ==========
  function initCheckout() {
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    if(!placeOrderBtn) return;
    
    placeOrderBtn.addEventListener('click', function() {
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
        const gcashRef = document.getElementById('gcashRef')?.value?.trim();
        if(!gcashRef) {
          alert('Please enter your GCash Reference Number.');
          return;
        }
        completeOrder('gcash', gcashRef);
      } else if(method === 'bank') {
        const bankRef = document.getElementById('bankRef')?.value?.trim();
        if(!bankRef) {
          alert('Please enter your Bank Transfer Reference Number.');
          return;
        }
        completeOrder('bank', bankRef);
      } else if(method === 'cod') {
        completeOrder('cod');
      } else if(method === 'paypal') {
        // PayPal handles its own flow
        alert('Please use the PayPal button below to complete payment.');
      }
    });
  }

  // ========== INITIALIZATION ==========
  document.addEventListener('DOMContentLoaded', function() {
    renderCart();
    initPaymentMethods();
    initCheckout();
    
    // Reset PayPal rendered flag when checkout modal opens
    const checkoutBtn = document.getElementById('checkoutBtn');
    if(checkoutBtn) {
      checkoutBtn.addEventListener('click', function() {
        paypalRendered = false;
      });
    }
  });
})();