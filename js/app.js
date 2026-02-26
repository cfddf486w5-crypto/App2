document.addEventListener('DOMContentLoaded', async () => {
    await Store.init();

    const syncStatus = document.getElementById('sync-status');
    const updateStatus = () => {
        if (!syncStatus) {
            return;
        }
        const online = navigator.onLine;
        syncStatus.textContent = online ? 'En ligne (cache actif)' : 'Mode hors-ligne sécurisé';
        syncStatus.classList.toggle('offline', !online);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();

    window.addEventListener('hashchange', () => Router.handleRoute());
    Router.handleRoute();

    AI.initUI();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => console.log('SW enregistré', reg.scope))
            .catch((err) => console.log('Erreur SW', err));
    }
});
