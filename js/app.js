document.addEventListener('DOMContentLoaded', async () => {
    // 1. Init Offline Store
    await Store.init();
    console.log("IndexedDB Initialized");

    // 2. Init Router
    window.addEventListener('hashchange', () => Router.handleRoute());
    Router.handleRoute(); // Load initial route

    // 3. Init AI
    AI.initUI();

    // 4. Register Service Worker (PWA)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW enregistré', reg.scope))
            .catch(err => console.log('Erreur SW', err));
    }
});
