# Authentication System - Quick Reference

## 🎯 How It Works Now

### Single Sign-In Point
- **NO separate login page needed**
- Everyone uses the **user button** (person icon) in the navbar
- Click it to sign in from any page

### Sign-In Process

1. **Click User Button** 👤
   - Not logged in? → Auth modal appears
   - Already logged in? → Dropdown menu appears

2. **Sign In Options**
   - 🔵 Google Sign-In (one click)
   - 📧 Email & Password
   - 🔄 Create new account
   - 🔑 Forgot password

3. **After Sign-In**
   - ✅ Stay on current page (no redirect)
   - ✅ User button changes to red gradient
   - ✅ Click user button again to see menu

---

## 📋 User Roles & Menus

### 👤 Regular User
**Dropdown Menu:**
```
┌─────────────────────┐
│  My Account         │
│  Logout             │
└─────────────────────┘
```

### 👑 Admin (domaycoselaine@gmail.com)
**Dropdown Menu:**
```
┌─────────────────────────┐
│  👑 Admin Dashboard     │
│  My Account             │
│  Logout                 │
└─────────────────────────┘
```

### 👨‍💼 Staff (domaycoscollege@gmail.com)
**Dropdown Menu:**
```
┌─────────────────────────┐
│  👨‍💼 Staff Dashboard     │
│  My Account             │
│  Logout                 │
└─────────────────────────┘
```

---

## 🔐 Protected Pages

### admin.html
- ✅ Only `domaycoselaine@gmail.com` can access
- ❌ Others get "Access denied" and redirect to index.html

### staff.html
- ✅ `domaycoscollege@gmail.com` (Staff) can access
- ✅ `domaycoselaine@gmail.com` (Admin) can also access
- ❌ Regular users get "Access denied" and redirect to index.html

### All Other Pages
- ✅ Open to everyone
- 🔓 No login required to browse
- 🛒 Login required to place orders

---

## 💡 Key Features

### Visual Indicators
- **Logged Out**: User button has default gray styling
- **Logged In**: User button has red gradient background with white icon

### Smart Behavior
- Modal closes automatically after successful sign-in
- Dropdown closes when clicking outside
- Press `Esc` to close modal
- Password reset via email

### No More login.html
- ❌ Removed separate login page
- ✅ Everything through the user button
- ✅ Cleaner user experience
- ✅ Admin/Staff access dashboard from dropdown

---

## 🧪 Testing

1. Open `index.html` in browser
2. Click user button (person icon)
3. Sign in with test credentials
4. Click user button again
5. Verify correct menu items appear
6. Test dashboard links (admin/staff only)
7. Test logout

---

## 🎨 User Experience Flow

```
User clicks 👤 button
        ↓
   Logged in?
        ↓
    YES → Show dropdown with role-based menu
        ↓
    NO → Show auth modal
        ↓
  User signs in
        ↓
  Modal closes automatically
        ↓
  User stays on same page
        ↓
  Click 👤 again to see menu
```

---

## 🔧 Technical Details

- **Auth Module**: `auth.js` - Global `window.AuthModule` API
- **UI Logic**: `script.js` - User button & dropdown handling
- **Firebase Auth**: Handles authentication backend
- **Real-time**: Auth state listener updates UI immediately
- **Role Detection**: Checks email to determine admin/staff status
