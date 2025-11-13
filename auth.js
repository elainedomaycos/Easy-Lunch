// Firebase Email/Password Auth (Compat)
// Requires firebase-app-compat.js and firebase-auth-compat.js to be loaded, and firebase.initializeApp called in the page.
(function () {
  const authStateListeners = [];

  function getCurrentUser() {
    return (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
  }

  // Admin configuration
  const ADMIN_EMAIL = "domaycoselaine@gmail.com";

  // Check if user is admin
  function isAdminUser(user) {
    return user && user.email === ADMIN_EMAIL;
  }

  // UI helpers
  function ensureAuthModal() {
    if (document.getElementById('authModal')) return;
    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
      <div class="auth-card">
        <button class="auth-close" id="authClose" aria-label="Close">&times;</button>
        <h2 class="auth-title" id="authTitle">Sign in</h2>
        <div class="auth-providers">
          <button type="button" class="provider-btn google" id="googleSignIn">
            <span class="provider-icon">G</span>
            <span>Continue with Google</span>
          </button>
          <button type="button" class="provider-btn apple" id="appleSignIn">
            <span class="provider-icon"></span>
            <span>Continue with Apple</span>
          </button>
          <div class="provider-sep"><span>or</span></div>
        </div>
        <form id="authForm" class="auth-form">
          <input type="email" id="authEmail" class="auth-input" placeholder="Email" required />
          <input type="password" id="authPassword" class="auth-input" placeholder="Password" required />
          <div class="auth-row">
            <button type="button" class="auth-link small" id="authForgot">Forgot password?</button>
          </div>
          <button type="submit" class="auth-submit" id="authSubmit">Sign in</button>
        </form>
        <p class="auth-switch">
          <span id="authSwitchText">Don't have an account?</span>
          <button class="auth-link" id="authSwitchBtn" type="button">Create one</button>
        </p>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('#authClose');
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    const form = modal.querySelector('#authForm');
    const title = modal.querySelector('#authTitle');
    const submit = modal.querySelector('#authSubmit');
    const switchBtn = modal.querySelector('#authSwitchBtn');
    const switchText = modal.querySelector('#authSwitchText');
    const googleBtn = modal.querySelector('#googleSignIn');
    const appleBtn = modal.querySelector('#appleSignIn');
    const forgotBtn = modal.querySelector('#authForgot');
    let mode = 'signin'; // 'signin' | 'signup'

    switchBtn.addEventListener('click', () => {
      mode = mode === 'signin' ? 'signup' : 'signin';
      if (mode === 'signin') {
        title.textContent = 'Sign in';
        submit.textContent = 'Sign in';
        switchText.textContent = "Don't have an account?";
        switchBtn.textContent = 'Create one';
        if (forgotBtn) forgotBtn.style.display = '';
      } else {
        title.textContent = 'Create account';
        submit.textContent = 'Sign up';
        switchText.textContent = 'Already have an account?';
        switchBtn.textContent = 'Sign in';
        if (forgotBtn) forgotBtn.style.display = 'none';
      }
    });

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        try {
          await signInWithGoogle();
          closeModal();
        } catch (err) {
          handleAuthError(err);
        }
      });
    }
    if (appleBtn) {
      appleBtn.addEventListener('click', async () => {
        try {
          await signInWithApple();
          closeModal();
        } catch (err) {
          handleAuthError(err);
        }
      });
    }

    if (forgotBtn) {
      forgotBtn.addEventListener('click', async () => {
        const email = modal.querySelector('#authEmail').value.trim();
        if (!email) {
          alert('Enter your email above first, then click "Forgot password?".');
          return;
        }
        try {
          await sendPasswordReset(email);
          alert('Password reset email sent. Check your inbox.');
        } catch (err) {
          handleAuthError(err);
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#authEmail').value.trim();
      const password = modal.querySelector('#authPassword').value;
      try {
        if (mode === 'signin') await signIn(email, password);
        else await signUp(email, password);
        closeModal();
      } catch (err) {
        handleAuthError(err);
      }
    });
  }

  function openModal() {
    ensureAuthModal();
    const modal = document.getElementById('authModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    const email = modal.querySelector('#authEmail');
    setTimeout(() => email && email.focus(), 10);
  }

  function closeModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // Firebase auth implementation
  async function signIn(email, password) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    await firebase.auth().signInWithEmailAndPassword(email, password);
    // Optionally redirect to account page after login (only from home/product pages)
    // Users can navigate back if they want
  }
  async function signUp(email, password) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
    // Optionally set display name to email prefix
    if (cred.user && !cred.user.displayName) {
      await cred.user.updateProfile({ displayName: email.split('@')[0] });
    }
    // Redirect to account page after successful signup
    setTimeout(() => {
      window.location.href = 'account.html';
    }, 500);
  }
  async function doSignOut() {
    if (!firebase || !firebase.auth) return;
    try {
      await firebase.auth().signOut();
      // Force refresh the page to ensure clean state
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
      alert('Error signing out: ' + error.message);
    }
  }
  async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
  }
  async function signInWithApple() {
    // Apple requires configuring Services ID and authorized domains in Firebase Console.
    const provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await firebase.auth().signInWithPopup(provider);
  }
  async function sendPasswordReset(email) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    await firebase.auth().sendPasswordResetEmail(email);
  }

  function handleAuthError(err) {
    if (!err) { alert('Authentication failed.'); return; }
    const code = err.code || '';
    // Common friendly messages
    const map = {
      'auth/invalid-login-credentials': 'Wrong email or password. Check your credentials or sign up first.',
      'auth/user-not-found': 'No account found for that email. Try signing up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'Email already in use. Try signing in.',
      'auth/popup-blocked': 'Popup blocked by the browser. Allow popups and try again.',
      'auth/popup-closed-by-user': 'Popup closed before completing sign-in.',
      'auth/account-exists-with-different-credential': 'An account exists with a different sign-in provider. Try that provider or reset your password.',
      'auth/operation-not-supported-in-this-environment': 'This action needs to run on http or https with web storage enabled. Serve your site (not file://) and try again.'
    };
    const msg = map[code] || err.message || 'Authentication failed.';
    alert(msg);
  }

  function initialsFromEmail(email) {
    if (!email) return 'U';
    const base = email.split('@')[0] || 'U';
    return base.slice(0, 1).toUpperCase();
  }

  function ensureUserMenu() {
    let menu = document.getElementById('userMenu');
    if (menu) {
      // Remove existing menu to recreate with updated state
      menu.remove();
    }
    
    const user = getCurrentUser();
    const isAdmin = isAdminUser(user);
    
    menu = document.createElement('div');
    menu.id = 'userMenu';
    menu.className = 'user-menu';
    menu.style.display = 'none';
    menu.innerHTML = `
      <button type="button" class="user-menu-item" id="myAccountBtn">My Account</button>
      ${isAdmin ? '<button type="button" class="user-menu-item" id="adminBtn">Admin Dashboard</button>' : ''}
      <button type="button" class="user-menu-item" id="signOutBtn">Sign out</button>
    `;
    document.body.appendChild(menu);

    // Event wiring
    document.getElementById('myAccountBtn').addEventListener('click', () => {
      hideUserMenu();
      window.location.href = 'account.html';
    });

    if (isAdmin) {
      document.getElementById('adminBtn').addEventListener('click', () => {
        hideUserMenu();
        window.location.href = 'admin.html';
      });
    }

    document.getElementById('signOutBtn').addEventListener('click', () => {
      doSignOut();
      hideUserMenu();
    });

    return menu;
  }

  function showUserMenu(button) {
    const menu = ensureUserMenu();
    positionMenu(button, menu);
    menu.style.display = 'block';
  }

  function hideUserMenu() {
    const menu = document.getElementById('userMenu');
    if (menu) {
      menu.style.display = 'none';
    }
  }

  function positionMenu(button, menu) {
    const rect = button.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = `${rect.left + window.scrollX}px`;
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    menu.style.zIndex = '1001';
  }

  function updateUserUi(user) {
    const btn = document.getElementById('userButton');
    if (!btn) return;
    
    // Remove any existing event listeners by cloning and replacing
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    if (user) {
      // Show initial avatar
      newBtn.innerHTML = `<div class="user-avatar">${initialsFromEmail(user.email)}</div>`;
      newBtn.style.cursor = 'pointer';
    } else {
      // Restore default icon
      newBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      `;
      newBtn.style.cursor = 'pointer';
    }

    // Add click event to new button
    newBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const user = getCurrentUser();
      if (!user) {
        openModal();
      } else {
        const currentMenu = document.getElementById('userMenu');
        if (currentMenu && currentMenu.style.display === 'block') {
          hideUserMenu();
        } else {
          showUserMenu(newBtn);
        }
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('userMenu');
      if (menu && !menu.contains(e.target) && !newBtn.contains(e.target)) {
        hideUserMenu();
      }
    });
  }

  // Public API
  window.SimpleAuth = {
    onAuthStateChanged(cb) {
      authStateListeners.push(cb);
      cb(getCurrentUser());
    },
    getCurrentUser,
    openSignIn: openModal,
    signOut: doSignOut,
  };

  // Init on DOM ready
  function init() {
    ensureAuthModal();
    updateUserUi(getCurrentUser());
    
    // Hook Firebase auth state
    if (firebase && firebase.auth) {
      firebase.auth().onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        updateUserUi(user);
        authStateListeners.forEach(cb => cb(user));
        
        // Recreate user menu to reflect admin status
        if (user) {
          ensureUserMenu();
        } else {
          hideUserMenu();
        }
      });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

