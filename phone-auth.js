// Firebase Phone Authentication with OTP
// This handles phone number verification for user registration
(function() {
  let confirmationResult = null;
  let recaptchaVerifier = null;
  
  // Initialize reCAPTCHA verifier
  function initRecaptcha() {
    // Clear existing verifier if any
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (e) {
        console.log('Could not clear previous verifier:', e);
      }
      recaptchaVerifier = null;
    }
    
    if (!firebase || !firebase.auth) {
      console.error('Firebase auth not loaded');
      return null;
    }
    
    const container = document.getElementById('recaptcha-container');
    if (!container) {
      console.error('reCAPTCHA container not found');
      return null;
    }
    
    // Clear the container
    container.innerHTML = '';
    
    try {
      // Use 'normal' size for better visibility and debugging
      // Change to 'invisible' for production
      recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'normal', // Changed from 'invisible' to 'normal' for testing
        'callback': (response) => {
          console.log('✅ reCAPTCHA solved successfully');
        },
        'expired-callback': () => {
          console.warn('⚠️ reCAPTCHA expired');
          alert('reCAPTCHA expired. Please try again.');
        }
      });
      
      // Render the reCAPTCHA
      recaptchaVerifier.render().then(function(widgetId) {
        console.log('✅ reCAPTCHA rendered with widget ID:', widgetId);
        window.recaptchaWidgetId = widgetId;
      }).catch(function(error) {
        console.error('❌ Error rendering reCAPTCHA:', error);
      });
      
      console.log('✅ reCAPTCHA verifier initialized');
      return recaptchaVerifier;
    } catch (error) {
      console.error('❌ Error initializing reCAPTCHA:', error);
      return null;
    }
  }
  
  // Reset reCAPTCHA
  function resetRecaptcha() {
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
        console.log('reCAPTCHA reset');
      } catch (e) {
        console.error('Error resetting reCAPTCHA:', e);
      }
    }
  }
  
  // Send OTP to phone number
  async function sendOTP(phoneNumber) {
    try {
      if (!firebase || !firebase.auth) {
        throw new Error('Firebase auth not loaded');
      }
      
      // Validate phone number format
      if (!phoneNumber.startsWith('+')) {
        throw new Error('Phone number must start with country code (e.g., +63)');
      }
      
      const verifier = initRecaptcha();
      if (!verifier) {
        throw new Error('Failed to initialize reCAPTCHA');
      }
      
      const appVerifier = verifier;
      confirmationResult = await firebase.auth().signInWithPhoneNumber(phoneNumber, appVerifier);
      
      console.log('OTP sent successfully');
      return { success: true, message: 'OTP sent to your phone' };
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Handle specific errors
      if (error.code === 'auth/invalid-phone-number') {
        return { success: false, message: 'Invalid phone number format. Use +63XXXXXXXXXX' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, message: 'Too many requests. Please try again later.' };
      } else if (error.code === 'auth/quota-exceeded') {
        return { success: false, message: 'SMS quota exceeded. Please try again tomorrow.' };
      }
      
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
  }
  
  // Verify OTP code
  async function verifyOTP(code) {
    try {
      if (!confirmationResult) {
        throw new Error('No OTP request found. Please request OTP first.');
      }
      
      const result = await confirmationResult.confirm(code);
      const user = result.user;
      
      console.log('Phone number verified:', user.phoneNumber);
      return { success: true, user: user };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        return { success: false, message: 'Invalid OTP code. Please try again.' };
      } else if (error.code === 'auth/code-expired') {
        return { success: false, message: 'OTP code expired. Please request a new one.' };
      }
      
      return { success: false, message: error.message || 'Failed to verify OTP' };
    }
  }
  
  // Link phone number to existing email/password account
  async function linkPhoneToAccount(phoneNumber, otpCode) {
    try {
      const currentUser = firebase.auth().currentUser;
      if (!currentUser) {
        throw new Error('No user signed in');
      }
      
      if (!confirmationResult) {
        throw new Error('No OTP request found. Please request OTP first.');
      }
      
      const credential = firebase.auth.PhoneAuthProvider.credential(
        confirmationResult.verificationId,
        otpCode
      );
      
      await currentUser.linkWithCredential(credential);
      console.log('Phone number linked to account');
      return { success: true, message: 'Phone number verified and linked!' };
    } catch (error) {
      console.error('Error linking phone:', error);
      
      if (error.code === 'auth/provider-already-linked') {
        return { success: false, message: 'Phone number already linked to this account' };
      } else if (error.code === 'auth/credential-already-in-use') {
        return { success: false, message: 'This phone number is already in use by another account' };
      }
      
      return { success: false, message: error.message || 'Failed to link phone number' };
    }
  }
  
  // Check if user has verified phone number
  function hasVerifiedPhone() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return false;
    
    // Check if phone number is in providerData
    const phoneProvider = currentUser.providerData.find(
      provider => provider.providerId === 'phone'
    );
    
    return !!phoneProvider;
  }
  
  // Export functions to window for global access
  window.phoneAuth = {
    sendOTP,
    verifyOTP,
    linkPhoneToAccount,
    hasVerifiedPhone,
    initRecaptcha,
    resetRecaptcha
  };
  
  console.log('✅ Phone authentication module loaded');
})();
