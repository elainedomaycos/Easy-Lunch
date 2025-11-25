# Firebase Phone Authentication Implementation Guide

## ✅ What's Been Implemented

### 1. **Phone Authentication Module** (`phone-auth.js`)
- Sends OTP to phone numbers via Firebase
- Verifies OTP codes
- Links phone numbers to existing accounts
- Checks if user has verified phone
- Includes error handling for common issues

### 2. **Checkout Protection** (`payment.js`)
- Users must be signed in to checkout
- Phone verification is required before checkout
- Automatic redirects to verification if needed
- Works for all payment methods (COD, GCash, etc.)

### 3. **Registration Flow** (`auth.js`)
- New users are prompted to verify phone after signup
- Redirects to account page with verification prompt
- Stores verification requirement in localStorage

### 4. **Phone Verification UI** (`phone-verify-modal.html`)
- Beautiful modal interface for phone verification
- Step-by-step OTP flow
- Resend OTP functionality
- Success/error message handling
- Auto-opens when verification is required

## 🚀 How to Complete the Setup

### Step 1: Add Phone Verification Modal to Your Pages

Add this to **`account.html`**, **`product.html`**, and any other pages where users might checkout:

```html
<!-- Add before closing </body> tag -->
<!-- Include the phone verification modal -->
<script>
  // Load phone verification modal
  fetch('phone-verify-modal.html')
    .then(response => response.text())
    .then(html => {
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div);
    });
</script>
```

### Step 2: Update Account Page

Add this HTML section to `account.html` to show phone verification status:

```html
<!-- Add this in your account dashboard -->
<div class="verification-status" style="background: #fff; padding: 2rem; border-radius: 1rem; margin-bottom: 2rem;">
  <h3 style="color: #c0392b; margin-bottom: 1rem;">🔒 Account Security</h3>
  <div id="phoneStatus">
    <p>Loading verification status...</p>
  </div>
  <button 
    id="verifyPhoneBtn" 
    onclick="openPhoneVerify()" 
    style="display: none; padding: 1rem 2rem; background: #c0392b; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1.4rem; margin-top: 1rem;"
  >
    Verify Phone Number
  </button>
</div>

<script>
  // Check phone verification status
  firebase.auth().onAuthStateChanged(function(user) {
    const phoneStatus = document.getElementById('phoneStatus');
    const verifyBtn = document.getElementById('verifyPhoneBtn');
    
    if (user) {
      const hasPhone = user.providerData.some(provider => provider.providerId === 'phone');
      
      if (hasPhone) {
        const phoneNumber = user.providerData.find(p => p.providerId === 'phone')?.phoneNumber || 'Verified';
        phoneStatus.innerHTML = `
          <p style="color: #27ae60; font-size: 1.5rem;">
            ✅ Phone Verified: ${phoneNumber}
          </p>
        `;
      } else {
        phoneStatus.innerHTML = `
          <p style="color: #e74c3c; font-size: 1.5rem;">
            ⚠️ Phone Not Verified - Required for checkout
          </p>
        `;
        verifyBtn.style.display = 'inline-block';
      }
    }
  });
</script>
```

### Step 3: Firebase Console Configuration

1. **Enable Phone Authentication**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `easy-lunch-368cf`
   - Go to **Authentication > Sign-in method**
   - Enable **Phone** provider
   - Save changes

2. **Configure reCAPTCHA** (Required for phone auth):
   - Phone authentication automatically uses reCAPTCHA
   - For production, add your domain to **Authorized domains**
   - For testing on localhost, it should work automatically

### Step 4: Testing the Flow

#### Test New User Registration with Phone Verification:

1. **Create Account**:
   - Go to your website
   - Click "Create Account"
   - Enter email and password
   - Click "Sign Up"

2. **Verify Phone**:
   - You'll be redirected to account page
   - Phone verification modal opens automatically
   - Enter phone number in format: `+63XXXXXXXXXX`
   - Click "Send Verification Code"
   - Check your phone for SMS with 6-digit code
   - Enter the code
   - Click "Verify Code"

3. **Try Checkout**:
   - Add items to cart
   - Click "Place Order"
   - If phone is verified: ✅ Proceeds to checkout
   - If not verified: ⚠️ Prompts to verify first

#### Test Existing User:

1. **Sign In**:
   - Sign in with existing account
   - If phone not verified, will be prompted during checkout

2. **Attempt Checkout**:
   - Add items to cart
   - Try to place order
   - System checks:
     - ✅ User signed in?
     - ✅ Phone verified?
   - If both YES: checkout proceeds
   - If NO: shows appropriate prompt

## 📋 Features Included

### Security Features:
- ✅ Users must be authenticated to checkout
- ✅ Phone number verification required
- ✅ OTP (One-Time Password) via SMS
- ✅ Prevents unauthorized purchases
- ✅ Verifies customer identity

### User Experience:
- ✅ Clear prompts and error messages
- ✅ Auto-open verification modal when needed
- ✅ Resend OTP option
- ✅ Beautiful, modern UI
- ✅ Mobile-responsive design

### Error Handling:
- ✅ Invalid phone number format
- ✅ Expired OTP codes
- ✅ Too many requests
- ✅ SMS quota exceeded
- ✅ Already verified phone numbers

## 🔧 Customization Options

### Change Phone Number Format:

Edit `phone-verify-modal.html`, line ~85:
```javascript
if (!phoneNumber.match(/^\+63\d{10}$/)) {
  // Change this regex for different countries
  // Example for US: /^\+1\d{10}$/
}
```

### Customize Messages:

Edit `phone-auth.js` to change error messages and success notifications.

### Optional: Make Phone Verification Mandatory During Signup

Edit `auth.js` signup function to require phone verification immediately:
```javascript
// After account creation, open phone modal instead of redirecting
if (window.openPhoneVerify) {
  openPhoneVerify();
} else {
  window.location.href = 'account.html?verify=phone';
}
```

## 🐛 Troubleshooting

### "reCAPTCHA verification failed"
- **Solution**: Make sure your domain is authorized in Firebase Console
- For localhost: should work automatically
- For production: add domain to Authorized domains list

### "SMS quota exceeded"
- **Solution**: Firebase free tier has SMS limits
- Upgrade to Blaze plan for higher limits
- Or wait 24 hours for quota reset

### "Invalid phone number"
- **Solution**: Use international format with country code
- Philippines: `+63XXXXXXXXXX` (10 digits after +63)
- US: `+1XXXXXXXXXX`

### Phone verification modal doesn't appear
- **Solution**: Make sure `phone-verify-modal.html` is included in the page
- Check browser console for errors
- Ensure Firebase scripts are loaded

## 📱 Phone Number Format by Country

- 🇵🇭 Philippines: `+63XXXXXXXXXX` (10 digits)
- 🇺🇸 USA: `+1XXXXXXXXXX` (10 digits)
- 🇬🇧 UK: `+44XXXXXXXXXX` (10 digits)
- 🇮🇳 India: `+91XXXXXXXXXX` (10 digits)

## ✨ Next Steps

1. Add the phone verification modal to all relevant pages
2. Test with real phone numbers
3. Monitor Firebase Console for authentication events
4. Consider adding SMS notifications for orders (future enhancement)

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase configuration
3. Ensure phone authentication is enabled in Firebase Console
4. Test with different phone numbers

---

**Security Note**: Never commit Firebase credentials to version control. Use environment variables for production.
