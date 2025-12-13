// ========== EASY LUNCH ANALYTICS ENGINE ==========
// Real-time analytics system for e-commerce dashboard
// Integrates with Firebase Firestore + localStorage fallback
// Auto-updates when new orders are placed

(function() {
  'use strict';

  // ========== CONFIGURATION ==========
  const ANALYTICS_CONFIG = {
    firestore: {
      ordersCollection: 'orders',
      usersCollection: 'users',
      productsCollection: 'products'
    },
    localStorage: {
      ordersKey: 'easy_lunch_orders_v1',
      cartKey: 'easy_lunch_cart_v1'
    },
    cache: {
      enabled: true,
      ttl: 60000 // 1 minute cache
    }
  };

  // Cache management
  const cache = {
    data: {},
    timestamps: {},
    set(key, value) {
      this.data[key] = value;
      this.timestamps[key] = Date.now();
    },
    get(key) {
      if (!this.data[key]) return null;
      const age = Date.now() - this.timestamps[key];
      if (age > ANALYTICS_CONFIG.cache.ttl) {
        delete this.data[key];
        delete this.timestamps[key];
        return null;
      }
      return this.data[key];
    },
    clear() {
      this.data = {};
      this.timestamps = {};
    }
  };

  // ========== DATA FETCHING ==========
  
  /**
   * Fetch all orders from Firestore (primary) or localStorage (fallback)
   * @returns {Promise<Array>} Array of order objects
   */
  async function fetchAllOrders() {
    const cached = cache.get('allOrders');
    if (cached && ANALYTICS_CONFIG.cache.enabled) {
      console.log('📊 Using cached orders');
      return cached;
    }

    try {
      // Try Firestore first
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        const db = firebase.firestore();
        const snapshot = await db.collection(ANALYTICS_CONFIG.firestore.ordersCollection).get();
        const firestoreOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log(`✅ Fetched ${firestoreOrders.length} orders from Firestore`);

        // Also fetch localStorage and merge to ensure UI reflects recent local orders
        let localOrders = [];
        try {
          const ordersJson = localStorage.getItem(ANALYTICS_CONFIG.localStorage.ordersKey);
          localOrders = ordersJson ? JSON.parse(ordersJson) : [];
          console.log(`📦 Fetched ${localOrders.length} orders from localStorage`);
        } catch (error) {
          console.warn('⚠️ Failed to read localStorage orders during merge:', error);
        }

        // Merge by orderId/id, prefer Firestore entries
        const byId = new Map();
        localOrders.forEach(o => {
          const id = o.orderId || o.id;
          if (id) byId.set(id, o);
        });
        firestoreOrders.forEach(o => {
          const id = o.orderId || o.id;
          if (id) byId.set(id, o);
        });

        const merged = Array.from(byId.values());
        cache.set('allOrders', merged);
        return merged;
      }
    } catch (error) {
      console.warn('⚠️ Firestore fetch failed, falling back to localStorage:', error);
    }

    // Fallback to localStorage
    try {
      const ordersJson = localStorage.getItem(ANALYTICS_CONFIG.localStorage.ordersKey);
      const orders = ordersJson ? JSON.parse(ordersJson) : [];
      console.log(`📦 Fetched ${orders.length} orders from localStorage`);
      cache.set('allOrders', orders);
      return orders;
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
      return [];
    }
  }

  /**
   * Fetch current cart items (for abandoned cart analysis)
   * @returns {Array} Array of cart items
   */
  function fetchCurrentCart() {
    try {
      const cartJson = localStorage.getItem(ANALYTICS_CONFIG.localStorage.cartKey);
      return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
      console.error('❌ Failed to fetch cart:', error);
      return [];
    }
  }

  // ========== ANALYTICS COMPUTATIONS ==========

  // Normalize order timestamp to a JavaScript Date
  function getOrderDate(order) {
    const ts = order?.timestamp;
    try {
      if (ts && typeof ts.toDate === 'function') {
        return ts.toDate(); // Firestore Timestamp
      }
      if (typeof ts === 'string' || typeof ts === 'number') {
        const d = new Date(ts);
        if (!isNaN(d.getTime())) return d;
      }
    } catch {}
    if (order?.created_at) {
      const d = new Date(order.created_at);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }

  /**
   * Calculate total sales revenue
   * @param {Array} orders - Array of order objects
   * @returns {number} Total revenue
   */
  function calculateTotalSales(orders) {
    return orders.reduce((sum, order) => {
      const total = order.totals?.total || 0;
      return sum + total;
    }, 0);
  }

  /**
   * Calculate total number of orders
   * @param {Array} orders - Array of order objects
   * @returns {number} Order count
   */
  function calculateTotalOrders(orders) {
    return orders.length;
  }

  /**
   * Calculate unique customer count
   * @param {Array} orders - Array of order objects
   * @returns {number} Unique customer count
   */
  function calculateTotalCustomers(orders) {
    const uniqueEmails = new Set();
    orders.forEach(order => {
      const email = order.customer?.email || order.userEmail;
      if (email) uniqueEmails.add(email.toLowerCase());
    });
    return uniqueEmails.size;
  }

  /**
   * Calculate Average Order Value (AOV)
   * @param {Array} orders - Array of order objects
   * @returns {number} Average order value
   */
  function calculateAverageOrderValue(orders) {
    if (orders.length === 0) return 0;
    const totalSales = calculateTotalSales(orders);
    return totalSales / orders.length;
  }

  /**
   * Find most ordered products
   * @param {Array} orders - Array of order objects
   * @param {number} limit - Number of top products to return
   * @returns {Array} Array of {name, quantity, revenue} objects
   */
  function calculateMostOrderedProducts(orders, limit = 5) {
    const productStats = {};

    orders.forEach(order => {
      const items = order.items || [];
      items.forEach(item => {
        const name = item.name;
        if (!productStats[name]) {
          productStats[name] = {
            name,
            quantity: 0,
            revenue: 0
          };
        }
        const qty = item.quantity || 1;
        productStats[name].quantity += qty;
        productStats[name].revenue += (item.price || 0) * qty;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  /**
   * Calculate sales trends over time periods
   * @param {Array} orders - Array of order objects
   * @param {string} period - 'daily', 'weekly', or 'monthly'
   * @param {number} count - Number of periods to return
   * @returns {Array} Array of {period, sales, orders} objects
   */
  function calculateSalesTrends(orders, period = 'daily', count = 7) {
    const now = new Date();
    const trends = [];

    for (let i = count - 1; i >= 0; i--) {
      let periodStart, periodEnd, label;

      if (period === 'daily') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - i);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setHours(23, 59, 59, 999);
        label = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - (i * 7));
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodStart.getDate() + 6);
        periodEnd.setHours(23, 59, 59, 999);
        label = `Week ${count - i}`;
      } else if (period === 'monthly') {
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - i);
        periodStart.setDate(1);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodStart.getMonth() + 1);
        periodEnd.setDate(0);
        periodEnd.setHours(23, 59, 59, 999);
        label = periodStart.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      }

      const periodOrders = orders.filter(order => {
        const orderDate = getOrderDate(order);
        return orderDate >= periodStart && orderDate <= periodEnd;
      });

      trends.push({
        period: label,
        date: periodStart.toISOString(),
        sales: calculateTotalSales(periodOrders),
        orders: periodOrders.length
      });
    }

    return trends;
  }

  /**
   * Calculate abandoned cart statistics
   * @returns {Object} Abandoned cart metrics
   */
  function calculateAbandonedCarts() {
    const currentCart = fetchCurrentCart();
    const cartValue = currentCart.reduce((sum, item) => {
      return sum + (item.price || 0) * (item.quantity || 1);
    }, 0);

    return {
      itemCount: currentCart.length,
      cartValue: cartValue,
      items: currentCart.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price || 0
      }))
    };
  }

  /**
   * Calculate inventory levels from recent orders
   * @param {Array} orders - Array of order objects
   * @param {number} lowStockThreshold - Threshold for low stock warning
   * @returns {Array} Array of product inventory status
   */
  function calculateInventoryLevels(orders, lowStockThreshold = 10) {
    // Get orders from last 30 days for trend analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = orders.filter(order => {
      return getOrderDate(order) >= thirtyDaysAgo;
    });

    const productDemand = {};

    recentOrders.forEach(order => {
      const items = order.items || [];
      items.forEach(item => {
        const name = item.name;
        if (!productDemand[name]) {
          productDemand[name] = {
            name,
            soldLast30Days: 0,
            avgDailyDemand: 0,
            stockStatus: 'normal'
          };
        }
        productDemand[name].soldLast30Days += (item.quantity || 1);
      });
    });

    // Calculate average daily demand and set stock status
    return Object.values(productDemand).map(product => {
      product.avgDailyDemand = (product.soldLast30Days / 30).toFixed(2);
      
      // Estimate days until restock needed (assuming current stock = 30 days supply)
      const estimatedStock = product.soldLast30Days;
      product.estimatedStock = estimatedStock;
      
      if (product.avgDailyDemand > lowStockThreshold) {
        product.stockStatus = 'low';
      } else if (product.avgDailyDemand > lowStockThreshold * 0.5) {
        product.stockStatus = 'medium';
      } else {
        product.stockStatus = 'high';
      }

      return product;
    }).sort((a, b) => b.avgDailyDemand - a.avgDailyDemand);
  }

  /**
   * Calculate payment method breakdown
   * @param {Array} orders - Array of order objects
   * @returns {Object} Payment method statistics
   */
  function calculatePaymentMethods(orders) {
    const methods = {};
    
    orders.forEach(order => {
      let method = order.payment?.method;
      // Skip orders without a valid payment method to avoid 'unknown'
      if (!method || typeof method !== 'string' || method.trim() === '') return;
      method = method.toLowerCase();
      // Normalize common aliases
      if (method === 'cash_on_delivery') method = 'cod';
      if (method === 'g-cash' || method === 'g_cash') method = 'gcash';
      if (!methods[method]) {
        methods[method] = {
          count: 0,
          revenue: 0
        };
      }
      methods[method].count++;
      methods[method].revenue += order.totals?.total || 0;
    });

    return methods;
  }

  /**
   * Calculate order status breakdown
   * @param {Array} orders - Array of order objects
   * @returns {Object} Order status statistics
   */
  function calculateOrderStatuses(orders) {
    const statuses = {};
    
    orders.forEach(order => {
      // Default missing/empty status to 'pending' instead of 'unknown'
      let status = order.status;
      if (!status || typeof status !== 'string' || status.trim() === '') status = 'pending';
      status = status.toLowerCase();
      if (!statuses[status]) {
        statuses[status] = 0;
      }
      statuses[status]++;
    });

    return statuses;
  }

  /**
   * Calculate customer lifetime value (CLV)
   * @param {Array} orders - Array of order objects
   * @returns {Array} Array of customer CLV data
   */
  function calculateCustomerLifetimeValue(orders) {
    const customers = {};

    orders.forEach(order => {
      const email = (order.customer?.email || order.userEmail || '').toLowerCase();
      if (!email) return;

      if (!customers[email]) {
        customers[email] = {
          email,
          totalSpent: 0,
          orderCount: 0,
          avgOrderValue: 0,
          firstOrder: order.timestamp,
          lastOrder: order.timestamp
        };
      }

      customers[email].totalSpent += order.totals?.total || 0;
      customers[email].orderCount++;
      
      const orderDate = getOrderDate(order);
      if (orderDate < new Date(customers[email].firstOrder)) {
        customers[email].firstOrder = orderDate.toISOString();
      }
      if (orderDate > new Date(customers[email].lastOrder)) {
        customers[email].lastOrder = orderDate.toISOString();
      }
    });

    return Object.values(customers)
      .map(customer => {
        customer.avgOrderValue = customer.totalSpent / customer.orderCount;
        return customer;
      })
      .sort((a, b) => b.totalSpent - a.totalSpent);
  }

  // ========== MAIN ANALYTICS API ==========

  /**
   * Get comprehensive analytics data
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Complete analytics object
   */
  async function getAnalytics(options = {}) {
    const {
      includeCustomerDetails = false,
      trendPeriod = 'daily',
      trendCount = 7,
      topProductsLimit = 5,
      lowStockThreshold = 10
    } = options;

    console.log('📊 Computing analytics...');
    const startTime = performance.now();

    const orders = await fetchAllOrders();

    const analytics = {
      metadata: {
        generatedAt: new Date().toISOString(),
        orderCount: orders.length,
        dataSource: typeof firebase !== 'undefined' && firebase.firestore ? 'firestore' : 'localStorage'
      },
      overview: {
        totalSales: calculateTotalSales(orders),
        totalOrders: calculateTotalOrders(orders),
        totalCustomers: calculateTotalCustomers(orders),
        averageOrderValue: calculateAverageOrderValue(orders)
      },
      products: {
        topSelling: calculateMostOrderedProducts(orders, topProductsLimit)
      },
      trends: {
        period: trendPeriod,
        data: calculateSalesTrends(orders, trendPeriod, trendCount)
      },
      abandonedCarts: calculateAbandonedCarts(),
      inventory: calculateInventoryLevels(orders, lowStockThreshold),
      paymentMethods: calculatePaymentMethods(orders),
      orderStatuses: calculateOrderStatuses(orders)
    };

    if (includeCustomerDetails) {
      analytics.customers = {
        lifetimeValue: calculateCustomerLifetimeValue(orders)
      };
    }

    const endTime = performance.now();
    analytics.metadata.computationTime = `${(endTime - startTime).toFixed(2)}ms`;

    console.log(`✅ Analytics computed in ${analytics.metadata.computationTime}`);
    return analytics;
  }

  /**
   * Get specific metric
   * @param {string} metric - Metric name ('totalSales', 'totalOrders', etc.)
   * @returns {Promise<any>} Metric value
   */
  async function getMetric(metric) {
    const orders = await fetchAllOrders();
    
    const metrics = {
      totalSales: () => calculateTotalSales(orders),
      totalOrders: () => calculateTotalOrders(orders),
      totalCustomers: () => calculateTotalCustomers(orders),
      averageOrderValue: () => calculateAverageOrderValue(orders),
      topProducts: () => calculateMostOrderedProducts(orders),
      dailyTrends: () => calculateSalesTrends(orders, 'daily', 7),
      weeklyTrends: () => calculateSalesTrends(orders, 'weekly', 4),
      monthlyTrends: () => calculateSalesTrends(orders, 'monthly', 6),
      abandonedCarts: () => calculateAbandonedCarts(),
      inventory: () => calculateInventoryLevels(orders),
      paymentMethods: () => calculatePaymentMethods(orders),
      orderStatuses: () => calculateOrderStatuses(orders)
    };

    if (metrics[metric]) {
      return metrics[metric]();
    } else {
      throw new Error(`Unknown metric: ${metric}`);
    }
  }

  // ========== REAL-TIME UPDATES ==========

  /**
   * Setup real-time analytics listeners
   * @param {Function} callback - Called when analytics update
   */
  function setupRealtimeAnalytics(callback) {
    console.log('🔄 Setting up real-time analytics listeners');

    // Listen to Firestore changes
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      db.collection(ANALYTICS_CONFIG.firestore.ordersCollection)
        .onSnapshot((snapshot) => {
          console.log('🔔 Firestore orders updated');
          cache.clear();
          getAnalytics().then(callback);
        });
    }

    // Listen to localStorage changes (same-tab)
    window.addEventListener('orders-updated', () => {
      console.log('🔔 LocalStorage orders updated');
      cache.clear();
      getAnalytics().then(callback);
    });

    // Listen to storage events (cross-tab)
    window.addEventListener('storage', (e) => {
      if (e.key === ANALYTICS_CONFIG.localStorage.ordersKey) {
        console.log('🔔 Cross-tab orders updated');
        cache.clear();
        getAnalytics().then(callback);
      }
    });
  }

  // ========== EXPORT UTILITIES ==========

  /**
   * Export analytics to JSON file
   * @param {Object} analytics - Analytics object
   * @param {string} filename - Export filename
   */
  function exportToJSON(analytics, filename = 'easy-lunch-analytics.json') {
    const dataStr = JSON.stringify(analytics, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`📥 Analytics exported to ${filename}`);
  }

  /**
   * Export analytics to CSV file
   * @param {Array} data - Array of objects to export
   * @param {string} filename - Export filename
   */
  function exportToCSV(data, filename = 'easy-lunch-data.csv') {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log(`📥 Data exported to ${filename}`);
  }

  // ========== PUBLIC API ==========
  window.EasyLunchAnalytics = {
    // Main functions
    getAnalytics,
    getMetric,
    setupRealtimeAnalytics,
    
    // Export utilities
    exportToJSON,
    exportToCSV,
    
    // Direct access to calculation functions
    calculate: {
      totalSales: calculateTotalSales,
      totalOrders: calculateTotalOrders,
      totalCustomers: calculateTotalCustomers,
      averageOrderValue: calculateAverageOrderValue,
      mostOrderedProducts: calculateMostOrderedProducts,
      salesTrends: calculateSalesTrends,
      abandonedCarts: calculateAbandonedCarts,
      inventoryLevels: calculateInventoryLevels,
      paymentMethods: calculatePaymentMethods,
      orderStatuses: calculateOrderStatuses,
      customerLifetimeValue: calculateCustomerLifetimeValue
    },
    
    // Data fetching
    fetchAllOrders,
    
    // Cache management
    clearCache: () => cache.clear()
  };

  console.log('✅ Easy Lunch Analytics Engine loaded');
})();
