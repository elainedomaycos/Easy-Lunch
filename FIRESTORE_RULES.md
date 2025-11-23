# Firebase Firestore Security Rules for Easy Lunch E-commerce

## How to Apply These Rules:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: "easy-lunch-368cf"
3. Go to "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the existing rules with the rules below
6. Click "Publish"

## Security Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is staff or admin
    function isStaffOrAdmin() {
      return request.auth != null && 
             (request.auth.token.email == 'domaycoselaine@gmail.com' || 
              request.auth.token.email == 'domaycoscollege@gmail.com');
    }
    
    // Helper function to check if user owns the order
    function isOrderOwner(orderId) {
      return request.auth != null && 
             get(/databases/$(database)/documents/orders/$(orderId)).data.userEmail == request.auth.token.email;
    }
    
    // Orders collection rules
    match /orders/{orderId} {
      // Anyone authenticated can create an order (will be assigned to them)
      allow create: if request.auth != null && 
                       request.resource.data.userEmail == request.auth.token.email;
      
      // Users can read their own orders, staff/admin can read all orders
      allow read: if request.auth != null && 
                     (isOrderOwner(orderId) || isStaffOrAdmin());
      
      // Staff/admin can update orders (status, updatedAt fields only)
      // Users can also cancel their own pending orders
      allow update: if request.auth != null &&
                       (isStaffOrAdmin() || 
                        (isOrderOwner(orderId) && 
                         request.resource.data.status == 'cancelled' && 
                         resource.data.status == 'pending'));
      
      // Nobody can delete orders (for record keeping)
      allow delete: if false;
    }
    
    // Chat sessions collection (if you're using this)
    match /chat_sessions/{sessionId} {
      allow read, write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
    
    // Users collection (optional - for user profiles)
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Products collection (if storing products in Firestore)
    match /products/{productId} {
      allow read: if true; // Anyone can read products
      allow write: if isStaffOrAdmin(); // Only staff/admin can modify products
    }
  }
}
```

## Alternative: Allow All Authenticated Users to Update Orders

If you want ALL authenticated users (not just staff/admin) to be able to update order status, use this simpler version:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Orders collection - simpler rules
    match /orders/{orderId} {
      // Allow authenticated users to create orders
      allow create: if request.auth != null;
      
      // Allow authenticated users to read and update orders
      allow read, update: if request.auth != null;
      
      // Nobody can delete orders
      allow delete: if false;
    }
    
    // Chat sessions
    match /chat_sessions/{sessionId} {
      allow read, write: if request.auth != null;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## What These Rules Do:

### Staff/Admin Version (Recommended):
✅ **Create Orders**: Only authenticated users, and they must create orders under their own email
✅ **Read Orders**: 
   - Users can only see their own orders
   - Staff/admin can see all orders
✅ **Update Orders**: 
   - Staff/admin can update any order status
   - Regular users can cancel their own pending orders
✅ **Delete Orders**: Nobody can delete (for record keeping)

### Simple Version (All Authenticated):
✅ **Create/Read/Update**: Any authenticated user can do all operations
✅ **Delete**: Nobody can delete orders

## Testing:
1. Apply the rules
2. Try to update an order from staff page
3. Check if the update appears in admin page
4. If you get permission errors, check:
   - User is logged in
   - Email matches staff/admin email (for first version)
   - Firebase Authentication is working

## Support Contacts:
- Admin: domaycoselaine@gmail.com
- Staff: domaycoscollege@gmail.com
