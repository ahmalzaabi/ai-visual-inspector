// Clear Service Worker Cache Script
// Access this at: https://yoursite.com/clear-cache.js

console.log('🧹 Clearing all caches and service workers...');

// Clear all caches
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      console.log('Deleting cache:', name);
      caches.delete(name);
    });
  });
}

// Unregister all service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('Unregistering SW:', registration.scope);
      registration.unregister();
    });
  });
}

// Force reload after clearing
setTimeout(() => {
  console.log('🔄 Reloading page...');
  window.location.reload(true);
}, 2000);

console.log('✅ Cache clearing initiated. Page will reload in 2 seconds.'); 