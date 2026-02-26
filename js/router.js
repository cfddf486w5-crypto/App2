const Router = {
    routes: {
        '#/modules': 'pages/modules.html',
        '#/consolidation': 'pages/consolidation.html',
        '#/history': 'pages/history.html',
        '#/settings': 'pages/settings.html'
    },

    async handleRoute() {
        const hash = window.location.hash || '#/modules';
        const root = document.getElementById('app-root');

        try {
            const page = this.routes[hash];
            if (page) {
                const resp = await fetch(page);
                root.innerHTML = await resp.text();
                this.executeScripts(root);
                this.markActiveNav(hash);
            } else {
                root.innerHTML = '<section class="page-wrap"><div class="glass-card"><h2>Module en construction</h2><p class="subtext">Ce module sera bientôt synchronisé au noyau offline.</p></div></section>';
                this.markActiveNav('');
            }
        } catch (error) {
            root.innerHTML = '<section class="page-wrap"><div class="glass-card"><h2>Erreur</h2><p class="subtext">Impossible de charger le module hors-ligne.</p></div></section>';
        }
    },

    markActiveNav(hash) {
        document.querySelectorAll('.nav-item').forEach((item) => {
            item.classList.toggle('is-active', item.getAttribute('href') === hash);
        });
    },

    executeScripts(element) {
        const scripts = element.querySelectorAll('script');
        scripts.forEach((oldScript) => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
};
