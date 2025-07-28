// ONLINE-ONLY MODE ACTIVATION SCRIPT (MediaPipe Style)
// Access this at: https://yoursite.com/clear-cache.js

console.log('🌐 ACTIVATING ONLINE-ONLY MODE (Like Google MediaPipe)...');
console.log('🧹 Clearing all offline caches and service workers...');

async function activateOnlineOnlyMode() {
  try {
    // Clear all caches
    if ('caches' in window) {
      const names = await caches.keys();
      console.log('📦 Found caches to clear:', names);
      await Promise.all(names.map(name => {
        console.log('🗑️ Deleting cache:', name);
        return caches.delete(name);
      }));
    }

    // Unregister all service workers completely
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('🔧 Found service workers to unregister:', registrations.length);
      await Promise.all(registrations.map(registration => {
        console.log('🔥 PERMANENTLY unregistering SW:', registration.scope);
        return registration.unregister();
      }));
    }

    // Clear browser storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('🧹 Cleared localStorage and sessionStorage');

    // Clear IndexedDB (ML model cache)
    if ('indexedDB' in window) {
      try {
        console.log('🗄️ Clearing TensorFlow.js model cache...');
        indexedDB.deleteDatabase('tensorflowjs');
      } catch (e) {
        console.log('⚠️ IndexedDB clear error:', e);
      }
    }

    console.log('✅ ONLINE-ONLY MODE ACTIVATED!');
    console.log('🚀 App now works like MediaPipe - fast, online-only');
    console.log('📱 PWA model loading should work on iPhone now');

  } catch (error) {
    console.error('❌ Error during online-only activation:', error);
  }
}

// Run activation
activateOnlineOnlyMode().then(() => {
  // Force hard reload with cache bust
  setTimeout(() => {
    console.log('🔄 Hard reloading with cache bust...');
    window.location.href = window.location.origin + '?online-only=' + Date.now();
  }, 2000);
});

console.log('✅ Online-only mode activation started. Page will reload in 2 seconds.'); 