# DL WMS - Offline PWA
Application WMS 100% hors-ligne.
Structure iPhone-first, UI premium.

## Déploiement local
1. Installez un serveur HTTP local (ex: `python -m http.server 8000` ou Live Server sur VSCode).
2. Ouvrez `http://localhost:8000`
3. L'app s'installe via le navigateur et fonctionne ensuite sans réseau (Service Worker + IndexedDB).

## Structure
- Les données sont dans `js/store.js` (IndexedDB).
- Le routing se fait via `js/router.js`.
- Le moteur IA est dans `js/ai.js`.
