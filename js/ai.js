// Offline Local Knowledge Base
const AI = {
    kb: [
        {
            keywords: ['remise', 'stock', 'bac'],
            answer: "<b>Remise en stock :</b> 1) Scannez le produit. 2) Confirmez la quantité. 3) Scannez le bac destination pour finaliser le déplacement."
        },
        {
            keywords: ['consolidation', 'charger', 'sku'],
            answer: "<b>Consolidation :</b> Ajoutez les SKU, puis exportez le CSV pour transmission au poste de pilotage."
        },
        {
            keywords: ['offline', 'hors ligne', 'réseau'],
            answer: "<b>Mode offline :</b> Toutes les données sont stockées en IndexedDB et restent disponibles sans internet."
        },
        {
            keywords: ['historique', 'log', 'journal'],
            answer: "<b>Historique :</b> Ouvrez l'onglet Historique pour voir tous les scans et changements de réglages."
        }
    ],

    query(text) {
        const lowerText = text.toLowerCase();
        for (const item of this.kb) {
            if (item.keywords.some((kw) => lowerText.includes(kw))) {
                return item.answer;
            }
        }
        return "Je n'ai pas de réponse précise hors-ligne. Essayez : consolidation, offline, historique.";
    },

    initUI() {
        const fab = document.getElementById('fab-ai');
        const panel = document.getElementById('ai-panel');
        const closeBtn = document.getElementById('close-ai');
        const sendBtn = document.getElementById('ai-send');
        const input = document.getElementById('ai-input');
        const chat = document.getElementById('ai-chat');

        const ask = () => {
            const val = input.value.trim();
            if (!val) {
                return;
            }

            chat.innerHTML += `<div style="color:white; margin: 10px 0;"><b>Vous:</b> ${val}</div>`;
            const response = this.query(val);
            chat.innerHTML += `<div style="margin-bottom: 10px; padding-left: 10px; border-left: 2px solid var(--primary);"><b>IA:</b> ${response}</div>`;
            input.value = '';
            chat.scrollTop = chat.scrollHeight;
        };

        fab.addEventListener('click', () => panel.classList.remove('hidden'));
        closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
        sendBtn.addEventListener('click', ask);
        input.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                ask();
            }
        });
    }
};
