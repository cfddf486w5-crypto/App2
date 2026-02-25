const Router = {
    routes: {
        '#/modules': async () => {
            const resp = await fetch('pages/modules.html');
            return await resp.text();
        },
        '#/consolidation': async () => {
            const resp = await fetch('pages/consolidation.html');
            return await resp.text();
        }
        // Add other routes here following the same pattern
    },
    
    async handleRoute() {
        const hash = window.location.hash || '#/modules';
        const root = document.getElementById('app-root');
        
        try {
            if (this.routes[hash]) {
                root.innerHTML = await this.routes[hash]();
                this.executeScripts(root);
            } else {
                root.innerHTML = '<div style="padding: 20px;"><h2>Module en construction</h2><p>Mode Offline activé.</p></div>';
            }
        } catch (e) {
            root.innerHTML = '<div style="padding: 20px;"><h2>Erreur</h2><p>Impossible de charger le module.</p></div>';
        }
    },

    executeScripts(element) {
        const scripts = element.querySelectorAll('script');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });
    }
};
