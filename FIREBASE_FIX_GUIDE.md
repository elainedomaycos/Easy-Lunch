# 🔥 Firebase Order Storage Troubleshooting Guide

## Problem
Orders are not being saved to Firebase Firestore when deployed on Vercel, but localStorage works fine.

---

## ✅ Step-by-Step Fix

### Step 1: Update Firestore Security Rules (AUTHENTICATED USERS ONLY)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **easy-lunch-368cf**
3. Navigate to: **Firestore Database** → **Rules**
4. Replace the rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection - AUTHENTICATED USERS ONLY
    match /orders/{orderId} {
      // Allow read for authenticated users (their own orders) or admin
      allow read: if request.auth != null && 
                    (resource.data.userUid == request.auth.uid || 
                     request.auth.token.email == 'domaycoselaine@gmail.com');
      
      // ✅ SECURE: Only authenticated users can create orders
      allow create: if request.auth != null;
      
      // Allow update/delete only for admin
      allow update, delete: if request.auth != null && 
                               request.auth.token.email == 'domaycoselaine@gmail.com';
    }
  }
}
```

5. Click **Publish**

**Why?** This ensures only logged-in users can place orders for security purposes. Guest checkout is disabled.

---

### Step 2: Test Firebase Connection

1. Open your Vercel site in Chrome
2. Open Developer Console (F12)
3. Add this temporary script tag to `product.html` (before closing `</body>`):

```html
<script src="firebase-diagnostic.js"></script>
```

4. Refresh the page and check console for diagnostic results
5. Look for any ❌ errors and follow the suggestions

---

### Step 3: Verify Firebase Scripts Are Loading

Check that `product.html` has these scripts in the correct order:

```html
<!-- Firebase Core (v9 compat) -->
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>

<!-- Firebase Config -->
<script>
  const firebaseConfig = {
    apiKey: "AIzaSyC1gn5zMy8sKJUfLc-vqOMkhDfR1s_2gAg",
    authDomain: "easy-lunch-368cf.firebaseapp.com",
    projectId: "easy-lunch-368cf",
    storageBucket: "easy-lunch-368cf.firebasestorage.app",
    messagingSenderId: "494805181477",
    appId: "1:494805181477:web:cb96df42879af6ccd08bcc"
  };
  
  if (typeof firebase !== 'undefined' && firebase.apps && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
</script>

<!-- Your payment.js AFTER Firebase -->
<script defer src="payment.js"></script>
```

---

### Step 4: Test Order Placement

1. Go to your Vercel site
2. Add items to cart
3. Complete checkout with COD
4. Open browser console (F12)
5. Look for these messages:
   - ✅ `Order saved to Firestore successfully! Doc ID: ...`
   - ❌ If you see errors, note the error code

---

## 🐛 Common Errors & Solutions

### Error: "Firebase not loaded"
**Solution:** Check script tags are present and loading. Check Vercel deployment logs.

### Error: "permission-denied"
**Solution:** Update Firestore rules (Step 1 above).

### Error: "CORS error" or "net::ERR_BLOCKED_BY_CLIENT"
**Solution:** Disable ad blockers or privacy extensions that block Firebase.

### Error: "Firebase already initialized"
**Solution:** Check for duplicate firebase initialization code.

---

## 🔍 How to Check if Orders Are Saved

### Method 1: Firebase Console
1. Go to Firebase Console → Firestore Database
2. Look for `orders` collection
3. Check if new documents appear after order placement

### Method 2: Browser Console
After placing an order, check console for:
```
✅ Order saved to Firestore successfully! Doc ID: abc123xyz
```

### Method 3: Admin Dashboard
1. Go to `admin.html` on your site
2. Check Real-time Orders section
3. New orders should appear automatically

---

## 📊 Monitoring & Debugging

### Enable Detailed Logging

The updated `payment.js` now includes:
- ✅ Success messages with document IDs
- ❌ Detailed error messages with error codes
- 🔄 Progress indicators
- ⚠️ User-friendly alerts when save fails

### Check Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Go to Deployments → [Latest] → Functions
4. Check for any errors during deployment

---

## 🎯 Quick Test Checklist

- [ ] Firestore rules updated to allow `create: if true`
- [ ] Firebase scripts loading (check Network tab)
- [ ] No console errors on page load
- [ ] Diagnostic script shows all ✅
- [ ] Test order creates Firestore document
- [ ] Order appears in Firebase Console
- [ ] Order appears in admin dashboard

---

## 🆘 Still Not Working?

If orders still don't save after all steps:

1. **Check Firestore Database Mode:**
   - Go to Firebase Console → Firestore Database
   - Ensure it's in "Production mode" (not Native mode)
   - If wrong mode, you'll need to recreate the database

2. **Check Firebase Plan:**
   - Go to Firebase Console → Usage
   - Ensure you haven't hit free tier limits
   - Spark plan: 50K reads/20K writes per day

3. **Check Network:**
   - Open Network tab in DevTools
   - Try to place order
   - Look for requests to `firestore.googleapis.com`
   - Check response status (should be 200)

4. **Export diagnostic report:**
   ```javascript
   // Run in console:
   console.save = function(data, filename){
     const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
     const e = document.createEvent('MouseEvents');
     const a = document.createElement('a');
     a.download = filename;
     a.href = window.URL.createObjectURL(blob);
     a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
     e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
     a.dispatchEvent(e);
   };
   
   // Then run diagnostic and save:
   console.save({
     firebase: typeof firebase !== 'undefined',
     version: typeof firebase !== 'undefined' ? firebase.SDK_VERSION : 'N/A',
     apps: typeof firebase !== 'undefined' ? firebase.apps.length : 0,
     user: firebase?.auth()?.currentUser?.email || 'guest'
   }, 'firebase-diagnostic.json');
   ```

---

## 📞 Need More Help?

Check these resources:
- [Firebase Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Deployment Logs](https://vercel.com/dashboard)

---

## ✅ Success Indicators

When everything is working correctly, you should see:

1. **Browser Console:**
   ```
   🔄 Saving order to Firestore...
   ✅ Order saved to Firestore successfully! Doc ID: ABC123
   Order placed: {orderId: "ORD-...", ...}
   ```

2. **Firebase Console:**
   - New document appears in `orders` collection immediately
   - Document has all order data (customer, items, totals, etc.)

3. **Admin Dashboard:**
   - Order appears in real-time orders list
   - All order details visible

---

**Last Updated:** December 2025  
**Status:** Enhanced error handling and diagnostics added ✅
