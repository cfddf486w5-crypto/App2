# DL WMS Professional - Offline PWA
Application WMS 100% hors-ligne avec interface iPhone + Windows.

## Fonctionnalités clés
- **Modules intégrés** : Consolidation, Historique, Réglages.
- **Offline-first** : Service Worker + IndexedDB.
- **Journal unifié** : toutes les actions importantes alimentent l'historique.
- **UI responsive** : ergonomie mobile (iPhone) et desktop (Windows).

## Déploiement local
1. Lancez un serveur HTTP local (`python -m http.server 8000`).
2. Ouvrez `http://localhost:8000`.
3. Installez l'application depuis le navigateur pour usage hors-ligne.

## Architecture
- `js/store.js` : accès IndexedDB (mouvements, réglages, journal).
- `js/router.js` : routage hash vers les pages HTML.
- `pages/*.html` : modules métier.
- `sw.js` : cache offline et mise à jour des assets.
