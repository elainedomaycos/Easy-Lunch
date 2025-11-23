// Firebase Firestore Orders Workflow
// Complete e-commerce order management system

// Initialize Firestore (using compat mode since that's what you're using)
const db = firebase.firestore();
const auth = firebase.auth();

/**
 * CREATE ORDER - Customer places an order
 * @param {Object} orderData - Order details (items, total, delivery info)
 * @returns {Promise<string>} - Returns the order ID
 */
async function createOrder(orderData) {
  try {
    // Get current authenticated user
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('You must be logged in to place an order');
    }

    // Prepare order document with required fields
    const orderDoc = {
      // User information
      userEmail: user.email,
      userId: user.uid,
      userName: orderData.customerName || user.displayName || 'Customer',
      
      // Order details
      items: orderData.items, // Array of {name, price, quantity, image}
      totals: {
        subtotal: orderData.subtotal || orderData.total,
        deliveryFee: orderData.deliveryFee || 50,
        discount: orderData.discount || 0,
        total: orderData.total
      },
      
      // Customer/Delivery information
      customer: {
        fullName: orderData.customerName,
        email: orderData.email || user.email,
        contact: orderData.phone,
        address: orderData.address,
        city: orderData.city || 'Mabini, Batangas'
      },
      
      // Payment information
      payment: {
        method: orderData.paymentMethod || 'Cash on Delivery',
        reference: orderData.paymentReference || ''
      },
      
      // Order status and timestamps
      status: 'pending', // pending → ready → completed → cancelled
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      
      // Optional fields
      notes: orderData.notes || '',
      orderId: generateOrderNumber()
    };

    // Add document to 'orders' collection
    const docRef = await db.collection('orders').add(orderDoc);
    
    console.log('✅ Order created successfully with ID:', docRef.id);
    
    // Also save to localStorage as backup (your existing logic)
    saveOrderToLocalStorage({ ...orderDoc, id: docRef.id, timestamp: new Date().toISOString() });
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw error;
  }
}

/**
 * REAL-TIME ORDER LISTENER - Listen to all orders (Staff/Admin)
 * @param {Function} callback - Called when orders update
 * @returns {Function} - Unsubscribe function
 */
function listenToAllOrders(callback) {
  // Query all orders, sorted by creation date (newest first)
  const unsubscribe = db.collection('orders')
    .orderBy('timestamp', 'desc')
    .onSnapshot(
      (snapshot) => {
        const orders = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            ...data,
            // Convert Firestore Timestamp to JavaScript Date/ISO string
            timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
          });
        });
        
        console.log(`📦 Received ${orders.length} orders from Firestore`);
        
        // Call the callback with updated orders
        callback(orders);
      },
      (error) => {
        console.error('❌ Error listening to orders:', error);
      }
    );

  // Return unsubscribe function to stop listening
  return unsubscribe;
}

/**
 * REAL-TIME USER ORDERS - Listen to current user's orders only
 * @param {Function} callback - Called when user's orders update
 * @returns {Function} - Unsubscribe function
 */
function listenToUserOrders(callback) {
  const user = auth.currentUser;
  
  if (!user) {
    console.warn('⚠️ No user logged in');
    return () => {};
  }

  // Query only orders belonging to current user
  const unsubscribe = db.collection('orders')
    .where('userEmail', '==', user.email)
    .orderBy('timestamp', 'desc')
    .onSnapshot(
      (snapshot) => {
        const orders = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          orders.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
          });
        });
        
        console.log(`📦 User has ${orders.length} orders`);
        callback(orders);
      },
      (error) => {
        console.error('❌ Error listening to user orders:', error);
      }
    );

  return unsubscribe;
}

/**
 * UPDATE ORDER STATUS - Staff/Admin marks order as completed/ready/cancelled
 * @param {string} orderId - The order document ID
 * @param {string} newStatus - New status: 'pending', 'ready', 'completed', 'cancelled'
 * @returns {Promise<void>}
 */
async function updateOrderStatus(orderId, newStatus) {
  try {
    // Reference to the specific order document
    const orderRef = db.collection('orders').doc(orderId);
    
    // Update only the status and updatedAt fields (allowed by security rules)
    await orderRef.update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Order ${orderId} status updated to: ${newStatus}`);
    
    // Also update localStorage for offline access
    updateOrderInLocalStorage(orderId, { status: newStatus });
    
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw error;
  }
}

/**
 * GET ORDER BY ID - Fetch a single order
 * @param {string} orderId - The order document ID
 * @returns {Promise<Object>} - Order data
 */
async function getOrderById(orderId) {
  try {
    const doc = await db.collection('orders').doc(orderId).get();
    
    if (!doc.exists) {
      throw new Error('Order not found');
    }
    
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      timestamp: data.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error fetching order:', error);
    throw error;
  }
}

/**
 * HELPER: Generate unique order number
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}

/**
 * HELPER: Save order to localStorage (backup)
 */
function saveOrderToLocalStorage(order) {
  const ORDERS_KEY = 'easy_lunch_orders_v1';
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

/**
 * HELPER: Update order in localStorage
 */
function updateOrderInLocalStorage(orderId, updates) {
  const ORDERS_KEY = 'easy_lunch_orders_v1';
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  const index = orders.findIndex(o => o.id === orderId || o.orderId === orderId);
  
  if (index !== -1) {
    orders[index] = { ...orders[index], ...updates };
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
}

// Make functions available globally for non-module scripts
window.createFirestoreOrder = createOrder;
window.listenToAllOrders = listenToAllOrders;
window.listenToUserOrders = listenToUserOrders;
window.updateFirestoreOrderStatus = updateOrderStatus;
window.getOrderById = getOrderById;
