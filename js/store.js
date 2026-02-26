// Offline-first IndexedDB Wrapper
const Store = {
    dbName: 'DL_WMS_DB',
    version: 2,
    db: null,

    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('consolidation_moves')) {
                    db.createObjectStore('consolidation_moves', { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains('activity_log')) {
                    db.createObjectStore('activity_log', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = async (event) => {
                this.db = event.target.result;
                await this.seedDefaults();
                resolve();
            };

            request.onerror = (event) => reject(event.target.error);
        });
    },

    seedDefaults() {
        return Promise.all([
            this.put('settings', { key: 'warehouseName', value: 'DL WMS - Site Principal' }),
            this.put('settings', { key: 'operator', value: 'Équipe A' }),
            this.put('settings', { key: 'theme', value: 'neon-night' }),
            this.put('settings', { key: 'offlineMode', value: true })
        ]);
    },

    add(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.add(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    put(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(data);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    getAll(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    get(storeName, key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    clear(storeName) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
};
