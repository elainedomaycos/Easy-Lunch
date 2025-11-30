# 📊 Easy Lunch Analytics System - Complete Guide

## 🎯 Overview

This analytics system provides real-time insights into your Easy Lunch e-commerce operations with the following capabilities:

- **Real-time data synchronization** with Firebase Firestore
- **Automatic fallback** to localStorage when offline
- **Comprehensive metrics** including sales, orders, customers, AOV
- **Visual dashboards** with Chart.js integration
- **Export capabilities** (JSON, CSV)
- **Inventory demand analysis**
- **Customer lifetime value tracking**

---

## 📁 File Structure

```
Easy Lunch/
├── analytics.js                 # Core analytics engine
├── analytics-dashboard.html     # Visual dashboard UI
└── ANALYTICS_GUIDE.md          # This file
```

---

## 🚀 Quick Start

### 1. Include Analytics Engine

Add to any HTML page (admin.html, staff.html, etc.):

```html
<!-- After Firebase scripts -->
<script src="analytics.js"></script>
```

### 2. Basic Usage

```javascript
// Get complete analytics
const analytics = await EasyLunchAnalytics.getAnalytics();
console.log(analytics);

// Get specific metric
const totalSales = await EasyLunchAnalytics.getMetric('totalSales');
console.log('Total Sales:', totalSales);

// Setup real-time updates
EasyLunchAnalytics.setupRealtimeAnalytics((updatedAnalytics) => {
  console.log('Analytics updated:', updatedAnalytics);
  // Update your UI here
});
```

### 3. Access Dashboard

Open `analytics-dashboard.html` in your browser or deploy it to your server.

---

## 📊 Available Metrics

### Overview Metrics

```javascript
const analytics = await EasyLunchAnalytics.getAnalytics();

// Access metrics:
analytics.overview.totalSales          // Total revenue (₱)
analytics.overview.totalOrders         // Number of orders
analytics.overview.totalCustomers      // Unique customers
analytics.overview.averageOrderValue   // AOV (₱)
```

### Product Analytics

```javascript
// Top 5 selling products
analytics.products.topSelling
// Returns: [{ name, quantity, revenue }, ...]
```

### Sales Trends

```javascript
// Daily, weekly, or monthly trends
analytics.trends.period  // 'daily', 'weekly', or 'monthly'
analytics.trends.data    // [{ period, date, sales, orders }, ...]
```

### Inventory Analysis

```javascript
// Product demand and stock status
analytics.inventory
// Returns: [{ name, soldLast30Days, avgDailyDemand, stockStatus }, ...]
```

### Payment Methods

```javascript
// Breakdown by payment method
analytics.paymentMethods
// Returns: { gcash: {count, revenue}, cod: {count, revenue}, ... }
```

### Customer Insights

```javascript
const analytics = await EasyLunchAnalytics.getAnalytics({
  includeCustomerDetails: true
});

// Customer lifetime value
analytics.customers.lifetimeValue
// Returns: [{ email, totalSpent, orderCount, avgOrderValue }, ...]
```

---

## 🛠️ API Reference

### Main Functions

#### `getAnalytics(options)`

Get comprehensive analytics data.

**Parameters:**
```javascript
{
  includeCustomerDetails: false,  // Include customer CLV data
  trendPeriod: 'daily',          // 'daily', 'weekly', or 'monthly'
  trendCount: 7,                 // Number of periods
  topProductsLimit: 5,           // Top N products
  lowStockThreshold: 10          // Stock warning threshold
}
```

**Returns:** Promise<Object> - Complete analytics object

**Example:**
```javascript
const analytics = await EasyLunchAnalytics.getAnalytics({
  trendPeriod: 'weekly',
  trendCount: 4,
  topProductsLimit: 10
});
```

#### `getMetric(metricName)`

Get a specific metric quickly.

**Available metrics:**
- `totalSales`
- `totalOrders`
- `totalCustomers`
- `averageOrderValue`
- `topProducts`
- `dailyTrends`
- `weeklyTrends`
- `monthlyTrends`
- `abandonedCarts`
- `inventory`
- `paymentMethods`
- `orderStatuses`

**Example:**
```javascript
const topProducts = await EasyLunchAnalytics.getMetric('topProducts');
const weeklyTrends = await EasyLunchAnalytics.getMetric('weeklyTrends');
```

#### `setupRealtimeAnalytics(callback)`

Listen for real-time data updates.

**Example:**
```javascript
EasyLunchAnalytics.setupRealtimeAnalytics((analytics) => {
  // Update your UI
  updateDashboard(analytics);
});
```

#### `fetchAllOrders()`

Fetch raw order data from database.

**Returns:** Promise<Array> - Array of order objects

#### `clearCache()`

Clear analytics cache to force fresh data fetch.

```javascript
EasyLunchAnalytics.clearCache();
```

### Export Functions

#### `exportToJSON(analytics, filename)`

Export analytics data as JSON file.

```javascript
const analytics = await EasyLunchAnalytics.getAnalytics();
EasyLunchAnalytics.exportToJSON(analytics, 'monthly-report.json');
```

#### `exportToCSV(data, filename)`

Export data array as CSV file.

```javascript
const orders = await EasyLunchAnalytics.fetchAllOrders();
EasyLunchAnalytics.exportToCSV(orders, 'orders-export.csv');

// Or export specific data
const topProducts = await EasyLunchAnalytics.getMetric('topProducts');
EasyLunchAnalytics.exportToCSV(topProducts, 'top-products.csv');
```

### Direct Calculation Functions

Access individual calculation functions:

```javascript
const orders = await EasyLunchAnalytics.fetchAllOrders();

// Calculate specific metrics
const totalSales = EasyLunchAnalytics.calculate.totalSales(orders);
const topProducts = EasyLunchAnalytics.calculate.mostOrderedProducts(orders, 10);
const trends = EasyLunchAnalytics.calculate.salesTrends(orders, 'monthly', 6);
```

---

## 🗄️ Database Structure

### Firestore Schema

**Collection:** `orders`

```javascript
{
  orderId: "EL1701234567890",
  timestamp: "2025-11-30T10:30:00.000Z",
  customer: {
    fullName: "Juan Dela Cruz",
    address: "123 Main St, Manila",
    contact: "09171234567",
    email: "juan@example.com"
  },
  items: [
    {
      name: "Buffalo Wings",
      price: 120,
      quantity: 2,
      img: "buff.jfif"
    }
  ],
  totals: {
    subtotal: 240,
    deliveryFee: 30,
    discount: 0,
    total: 270
  },
  payment: {
    method: "gcash",
    reference: "ABC123",
    status: "paid"
  },
  status: "pending",
  userUid: "firebase-user-id",
  userEmail: "juan@example.com"
}
```

### localStorage Backup

**Key:** `easy_lunch_orders_v1`

Same structure as Firestore, stored as JSON array.

---

## 🎨 Dashboard Customization

### Modify Chart Colors

Edit `analytics-dashboard.html`:

```javascript
// Sales Trends Chart
borderColor: '#c0392b',  // Line color
backgroundColor: 'rgba(192, 57, 43, 0.1)',  // Fill color

// Payment Methods Chart
const colors = ['#c0392b', '#2196F3', '#4CAF50', '#ff9800', '#9c27b0'];
```

### Adjust Stats Display

Modify `renderDashboard()` function:

```javascript
function renderDashboard(analytics) {
  // Add custom formatting
  const salesFormatted = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(analytics.overview.totalSales);
  
  document.getElementById('totalSales').textContent = salesFormatted;
}
```

### Add New Charts

```javascript
function renderCustomChart(data) {
  const ctx = document.getElementById('myChart');
  
  new Chart(ctx, {
    type: 'bar',  // bar, line, pie, doughnut, etc.
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        label: 'My Data',
        data: data.map(d => d.value),
        backgroundColor: '#c0392b'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}
```

---

## 🔥 Firebase Optimization

### Recommended Firestore Indexes

Create composite indexes for better query performance:

1. **Orders by Date Range:**
   ```
   Collection: orders
   Fields: timestamp (Ascending), status (Ascending)
   ```

2. **User Orders:**
   ```
   Collection: orders
   Fields: userEmail (Ascending), timestamp (Descending)
   ```

3. **Payment Analysis:**
   ```
   Collection: orders
   Fields: payment.method (Ascending), timestamp (Descending)
   ```

### Create Indexes via Firebase Console:

1. Go to: Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Add the field combinations above
4. Save and wait for index creation

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection
    match /orders/{orderId} {
      // Allow read for authenticated users (their own orders)
      allow read: if request.auth != null && 
                    (resource.data.userUid == request.auth.uid || 
                     request.auth.token.email == 'domaycoselaine@gmail.com');
      
      // Allow write for authenticated users
      allow create: if request.auth != null;
      
      // Allow update/delete only for admin
      allow update, delete: if request.auth != null && 
                               request.auth.token.email == 'domaycoselaine@gmail.com';
    }
  }
}
```

---

## 📈 Performance Tips

### 1. Enable Caching

Analytics engine includes built-in caching (1-minute TTL by default):

```javascript
// Cache is enabled by default
// Clear cache manually if needed
EasyLunchAnalytics.clearCache();
```

### 2. Lazy Load Analytics

Load analytics only when dashboard is accessed:

```javascript
// In admin.html
document.getElementById('analyticsTab').addEventListener('click', async () => {
  if (!window.analyticsLoaded) {
    const analytics = await EasyLunchAnalytics.getAnalytics();
    renderAnalytics(analytics);
    window.analyticsLoaded = true;
  }
});
```

### 3. Pagination for Large Datasets

For handling many orders:

```javascript
async function fetchOrdersPaginated(limit = 100) {
  const db = firebase.firestore();
  const snapshot = await db.collection('orders')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### 4. Background Sync

Periodically sync data in background:

```javascript
// Refresh every 5 minutes
setInterval(async () => {
  EasyLunchAnalytics.clearCache();
  const analytics = await EasyLunchAnalytics.getAnalytics();
  updateDashboardSilently(analytics);
}, 5 * 60 * 1000);
```

---

## 🔧 Integration Examples

### Add Analytics to Admin Dashboard

Edit `admin.html`:

```html
<!-- Add analytics script -->
<script src="analytics.js"></script>

<!-- Add analytics section -->
<div id="analytics-section" class="section">
  <div class="stats-grid">
    <div class="stat-card">
      <h3>Total Sales</h3>
      <p class="stat-value" id="adminTotalSales">₱0.00</p>
    </div>
    <!-- More stat cards... -->
  </div>
  
  <button onclick="viewFullAnalytics()">View Full Analytics Dashboard</button>
</div>

<script>
  // Load analytics on page load
  async function loadAdminAnalytics() {
    try {
      const analytics = await EasyLunchAnalytics.getAnalytics({
        trendPeriod: 'daily',
        trendCount: 7
      });
      
      document.getElementById('adminTotalSales').textContent = 
        `₱${analytics.overview.totalSales.toFixed(2)}`;
      
      // Update other metrics...
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }
  
  function viewFullAnalytics() {
    window.open('analytics-dashboard.html', '_blank');
  }
  
  // Setup real-time updates
  EasyLunchAnalytics.setupRealtimeAnalytics(loadAdminAnalytics);
  
  // Initial load
  document.addEventListener('DOMContentLoaded', loadAdminAnalytics);
</script>
```

### Show Analytics Widget

Create a quick stats widget:

```html
<div class="analytics-widget">
  <h3>Today's Performance</h3>
  <div id="todayStats"></div>
</div>

<script>
  async function showTodayStats() {
    const analytics = await EasyLunchAnalytics.getAnalytics({
      trendPeriod: 'daily',
      trendCount: 1
    });
    
    const today = analytics.trends.data[0];
    document.getElementById('todayStats').innerHTML = `
      <p>Sales: ₱${today.sales.toFixed(2)}</p>
      <p>Orders: ${today.orders}</p>
    `;
  }
  
  showTodayStats();
</script>
```

---

## 🐛 Troubleshooting

### Analytics Not Loading

**Issue:** Dashboard shows "Loading..." indefinitely

**Solutions:**
1. Check Firebase configuration is correct
2. Verify Firestore rules allow read access
3. Check browser console for errors
4. Test with localStorage fallback:
   ```javascript
   // Temporarily disable Firestore
   const orders = JSON.parse(localStorage.getItem('easy_lunch_orders_v1') || '[]');
   console.log('Orders:', orders);
   ```

### Real-time Updates Not Working

**Issue:** Dashboard doesn't update when new orders placed

**Solutions:**
1. Verify Firestore `.onSnapshot()` listener is active
2. Check browser console for listener errors
3. Ensure orders are being saved to Firestore (not just localStorage)
4. Test by manually adding order in Firestore console

### Charts Not Rendering

**Issue:** Chart containers are empty

**Solutions:**
1. Verify Chart.js is loaded: `console.log(typeof Chart)`
2. Check canvas elements exist: `document.getElementById('salesTrendsChart')`
3. Ensure data format is correct for chart type
4. Check browser console for Chart.js errors

### Performance Issues

**Issue:** Dashboard is slow with many orders

**Solutions:**
1. Enable caching (already enabled by default)
2. Reduce `trendCount` and `topProductsLimit`
3. Implement pagination for order lists
4. Use Firestore indexes (see optimization section)
5. Consider data archiving for old orders

---

## 📊 Advanced Use Cases

### Custom Date Range Analysis

```javascript
async function getCustomRangeAnalytics(startDate, endDate) {
  const orders = await EasyLunchAnalytics.fetchAllOrders();
  
  const filtered = orders.filter(order => {
    const orderDate = new Date(order.timestamp);
    return orderDate >= startDate && orderDate <= endDate;
  });
  
  return {
    totalSales: EasyLunchAnalytics.calculate.totalSales(filtered),
    totalOrders: filtered.length,
    topProducts: EasyLunchAnalytics.calculate.mostOrderedProducts(filtered, 5)
  };
}

// Usage
const start = new Date('2025-11-01');
const end = new Date('2025-11-30');
const novemberStats = await getCustomRangeAnalytics(start, end);
```

### Customer Segmentation

```javascript
async function segmentCustomers() {
  const analytics = await EasyLunchAnalytics.getAnalytics({
    includeCustomerDetails: true
  });
  
  const customers = analytics.customers.lifetimeValue;
  
  return {
    vip: customers.filter(c => c.totalSpent > 1000),
    regular: customers.filter(c => c.orderCount >= 3 && c.totalSpent <= 1000),
    new: customers.filter(c => c.orderCount < 3)
  };
}
```

### Predictive Inventory

```javascript
async function predictRestockDate(productName, currentStock) {
  const inventory = await EasyLunchAnalytics.getMetric('inventory');
  const product = inventory.find(p => p.name === productName);
  
  if (!product) return null;
  
  const dailyDemand = parseFloat(product.avgDailyDemand);
  const daysUntilRestock = Math.floor(currentStock / dailyDemand);
  
  const restockDate = new Date();
  restockDate.setDate(restockDate.getDate() + daysUntilRestock);
  
  return {
    daysRemaining: daysUntilRestock,
    restockDate: restockDate.toLocaleDateString(),
    recommendedOrderQty: Math.ceil(dailyDemand * 30) // 30-day supply
  };
}
```

---

## 🚀 Deployment

### Deploy to Vercel

1. Ensure `analytics.js` and `analytics-dashboard.html` are in your repo
2. Push to GitHub
3. Vercel will automatically serve static files
4. Access at: `https://your-app.vercel.app/analytics-dashboard.html`

### Add to Admin Navigation

In `admin.html`, add menu item:

```html
<li>
  <a href="analytics-dashboard.html" target="_blank">
    <span>📊</span>
    <span>Analytics</span>
  </a>
</li>
```

---

## 📚 Additional Resources

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

---

## ✅ Summary

You now have a complete analytics system with:

✅ Real-time data fetching from Firestore + localStorage fallback  
✅ Comprehensive metrics (sales, orders, customers, AOV)  
✅ Product performance analysis  
✅ Sales trends (daily/weekly/monthly)  
✅ Inventory demand forecasting  
✅ Customer lifetime value tracking  
✅ Visual dashboard with Chart.js  
✅ Export capabilities (JSON/CSV)  
✅ Real-time updates when orders placed  
✅ Optimized with caching and indexes  

**Next Steps:**
1. Open `analytics-dashboard.html` to view your dashboard
2. Integrate analytics widgets into `admin.html`
3. Set up Firestore indexes for better performance
4. Customize charts and metrics for your needs

Happy analyzing! 📊🚀
