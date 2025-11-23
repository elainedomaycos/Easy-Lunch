// Firebase Email/Password Auth (Compat mode)
// Requires firebase-app-compat.js and firebase-auth-compat.js
(function () {
  const authStateListeners = [];
  
  function getCurrentUser() {
    return (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
  }
  
  const ADMIN_EMAIL = "domaycoselaine@gmail.com";
  const STAFF_EMAIL = "domaycoscollege@gmail.com";
  
  function isAdminUser(user) {
    return user && user.email === ADMIN_EMAIL;
  }
  
  function isStaffUser(user) {
    return user && user.email === STAFF_EMAIL;
  }
  
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
    const forgotBtn = modal.querySelector('#authForgot');
    let mode = 'signin';

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

  async function signIn(email, password) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    return userCredential.user;
  }

  async function signUp(email, password) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  }

  async function signInWithGoogle() {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const userCredential = await firebase.auth().signInWithPopup(provider);
    return userCredential.user;
  }

  async function sendPasswordReset(email) {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    await firebase.auth().sendPasswordResetEmail(email);
  }

  async function signOut() {
    if (!firebase || !firebase.auth) throw new Error('Firebase not loaded');
    await firebase.auth().signOut();
  }

  function handleAuthError(error) {
    console.error('Auth error:', error);
    const msgMap = {
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'Email is already registered.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/network-request-failed': 'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup closed. Please try again.',
      'auth/cancelled-popup-request': 'Another popup is already open.',
      'auth/popup-blocked': 'Popup blocked. Allow popups for this site.',
    };
    alert(msgMap[error.code] || error.message || 'An error occurred.');
  }

  function onAuthStateChanged(callback) {
    if (!callback) return;
    authStateListeners.push(callback);
    if (firebase && firebase.auth) {
      firebase.auth().onAuthStateChanged(callback);
    }
  }

  function initAuthStateListener() {
    if (!firebase || !firebase.auth) {
      console.warn('Firebase not initialized yet');
      return;
    }
    
    firebase.auth().onAuthStateChanged(async (user) => {
      const currentPath = window.location.pathname;
      const isAdminPage = currentPath.includes('admin.html');
      const isStaffPage = currentPath.includes('staff.html');

      if (user) {
        console.log('User signed in:', user.email);
        
        // Protect admin page - only admin can access
        if (isAdminPage && !isAdminUser(user)) {
          alert('Access denied. Admin only.');
          await signOut();
          window.location.href = 'index.html';
          return;
        }
        
        // Protect staff page - staff or admin can access
        if (isStaffPage && !isStaffUser(user) && !isAdminUser(user)) {
          alert('Access denied. Staff or Admin only.');
          await signOut();
          window.location.href = 'index.html';
          return;
        }
        
        // No automatic redirects for regular pages
        // Admin/Staff will see dashboard links in the dropdown menu
      } else {
        console.log('User signed out');
        
        // Redirect to index if trying to access protected pages without login
        if (isAdminPage || isStaffPage) {
          window.location.href = 'index.html';
        }
      }

      authStateListeners.forEach(listener => {
        if (listener !== firebase.auth().onAuthStateChanged) {
          listener(user);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuthStateListener);
  } else {
    initAuthStateListener();
  }

  window.AuthModule = {
    openModal,
    closeModal,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    getCurrentUser,
    onAuthStateChanged,
    isAdminUser,
    isStaffUser,
    ADMIN_EMAIL,
    STAFF_EMAIL
  };
})();