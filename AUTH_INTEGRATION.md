# Authentication Integration Guide

## Overview
The `auth.js` module has been successfully integrated across all pages. Users can now sign in via Google or email/password from any page using the user button in the navbar.

## How It Works

### 1. User Button Behavior
- **When logged out**: Clicking the user button opens the authentication modal
- **When logged in**: Clicking the user button shows a dropdown with:
  - My Account (links to account.html)
  - Logout button

### 2. Visual Feedback
- **Logged out**: User button has default styling
- **Logged in**: User button has red gradient background with white icon

### 3. Authentication Options
- **Google Sign-In**: One-click authentication via Google
- **Email/Password**: Traditional sign-in/sign-up
- **Password Reset**: Forgot password functionality included

## Files Modified

### auth.js (NEW - Clean Version)
- Removed Apple login completely
- Contains authentication modal UI
- Handles Firebase authentication
- Provides AuthModule global API
- Manages role-based redirects (Admin/Staff)

### script.js (UPDATED)
Added authentication integration:
- User button click handler
- Dropdown toggle logic
- Logout functionality
- Auth state listener for UI updates
- Visual feedback based on login status

### Pages with Auth Integration
All pages have `auth.js` imported:
- ✅ index.html
- ✅ product.html
- ✅ account.html
- ✅ about-us.html
- ✅ admin.html
- ✅ staff.html

### Dynamic Dropdown Menu
The user button dropdown menu adapts based on user role:
- **Regular Users**: See "My Account" and "Logout"
- **Admin**: See "👑 Admin Dashboard", "My Account", and "Logout"
- **Staff**: See "👨‍💼 Staff Dashboard", "My Account", and "Logout"
- **Not Logged In**: Clicking user button opens auth modal

## AuthModule API

The global `window.AuthModule` provides:

```javascript
AuthModule.openModal()           // Show auth modal
AuthModule.closeModal()          // Hide auth modal
AuthModule.signIn(email, pass)   // Email/password sign in
AuthModule.signUp(email, pass)   // Create new account
AuthModule.signInWithGoogle()    // Google OAuth
AuthModule.signOut()             // Logout
AuthModule.getCurrentUser()      // Get current user object
AuthModule.onAuthStateChanged()  // Listen for auth changes
AuthModule.isAdminUser(user)     // Check if user is admin
AuthModule.isStaffUser(user)     // Check if user is staff
AuthModule.sendPasswordReset()   // Send password reset email
```

## Admin & Staff Configuration

- **Admin Email**: domaycoselaine@gmail.com
- **Staff Email**: domaycoscollege@gmail.com

These users get special access to admin.html and staff.html pages.

## User Flow

### For Regular Users:
1. Click user button → Auth modal opens
2. Sign in with Google or Email/Password
3. Stay on current page (no redirect)
4. Dropdown menu shows: "My Account" and "Logout"
5. Can access My Account page
6. Can place orders and view order history

### For Admin:
1. Click user button → Auth modal opens
2. Sign in with admin email (domaycoselaine@gmail.com)
3. Stay on current page (no redirect)
4. Dropdown menu shows: "👑 Admin Dashboard", "My Account", and "Logout"
5. Can click "Admin Dashboard" to go to admin.html
6. Can manage orders, view analytics, and access all features

### For Staff:
1. Click user button → Auth modal opens
2. Sign in with staff email (domaycoscollege@gmail.com)
3. Stay on current page (no redirect)
4. Dropdown menu shows: "👨‍💼 Staff Dashboard", "My Account", and "Logout"
5. Can click "Staff Dashboard" to go to staff.html
6. Can manage orders and view order statistics

## Testing

To test the authentication:
1. Open index.html in a browser
2. Click the user icon (person icon) in the navbar
3. Auth modal should appear
4. Try signing in with Google or creating an account
5. After login, click user icon again to see the dropdown
6. Test logout functionality

## Security Features

- Role-based access control
- Protected routes for admin/staff
- Automatic redirect on unauthorized access
- Firebase Authentication backend
- Secure password handling
