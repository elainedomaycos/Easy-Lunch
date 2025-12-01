// Firebase Diagnostic Tool
// Add this script to your page temporarily to diagnose Firebase issues

(function() {
  console.log('=== FIREBASE DIAGNOSTIC START ===');
  
  // Check if Firebase is loaded
  if (typeof firebase === 'undefined') {
    console.error('❌ Firebase library not loaded! Check if script tag is present.');
    return;
  }
  console.log('✅ Firebase library loaded');
  
  // Check Firebase version
  console.log('📦 Firebase version:', firebase.SDK_VERSION);
  
  // Check if Firebase is initialized
  try {
    const apps = firebase.apps;
    if (apps.length === 0) {
      console.error('❌ Firebase not initialized! Check firebaseConfig.');
    } else {
      console.log('✅ Firebase initialized:', apps.length, 'app(s)');
      console.log('📱 App name:', apps[0].name);
      console.log('⚙️  App options:', {
        apiKey: apps[0].options.apiKey ? '***' + apps[0].options.apiKey.slice(-4) : 'missing',
        authDomain: apps[0].options.authDomain,
        projectId: apps[0].options.projectId
      });
    }
  } catch(e) {
    console.error('❌ Error checking Firebase apps:', e);
  }
  
  // Check Firestore
  if (!firebase.firestore) {
    console.error('❌ Firestore not available! Check if firestore script is loaded.');
    return;
  }
  console.log('✅ Firestore available');
  
  // Test Firestore connection
  try {
    const db = firebase.firestore();
    console.log('✅ Firestore instance created');
    
    // Test write permission (creates a test doc)
    console.log('🔄 Testing Firestore write permission...');
    db.collection('_test_connection').add({
      test: true,
      timestamp: new Date(),
      source: 'diagnostic'
    })
    .then(docRef => {
      console.log('✅ Firestore WRITE test successful! Doc ID:', docRef.id);
      // Clean up test doc
      return docRef.delete();
    })
    .then(() => {
      console.log('✅ Test document cleaned up');
    })
    .catch(error => {
      console.error('❌ Firestore WRITE test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'permission-denied') {
        console.error('💡 Solution: Update Firestore security rules to allow writes');
      }
    });
    
    // Test read permission
    console.log('🔄 Testing Firestore read permission...');
    db.collection('orders').limit(1).get()
      .then(snapshot => {
        console.log('✅ Firestore READ test successful! Found', snapshot.size, 'document(s)');
      })
      .catch(error => {
        console.error('❌ Firestore READ test failed:', error);
      });
      
  } catch(e) {
    console.error('❌ Error creating Firestore instance:', e);
  }
  
  // Check Auth
  if (firebase.auth) {
    console.log('✅ Firebase Auth available');
    const user = firebase.auth().currentUser;
    if (user) {
      console.log('👤 User logged in:', user.email || user.uid);
    } else {
      console.log('👤 No user logged in (guest mode)');
    }
  } else {
    console.log('⚠️  Firebase Auth not loaded');
  }
  
  console.log('=== FIREBASE DIAGNOSTIC END ===');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check console for any ❌ errors above');
  console.log('2. If permission-denied: Update Firestore rules');
  console.log('3. If Firebase not loaded: Check script tags in HTML');
  console.log('4. Test order placement and check for new errors');
})();
