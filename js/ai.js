// Offline Local Knowledge Base
const AI = {
    kb: [
        { keywords: ['remise', 'stock', 'bac'], answer: "<b>Remise en stock:</b> 1. Scannez le produit. 2. Si c'est un produit unique, confirmez. 3. Scannez le bin de destination. <br><br><i>Pourquoi?</i> Cela garantit que chaque pièce va dans l'allée optimisée." },
        { keywords: ['consolidation', 'charger', 'optimiser'], answer: "<b>Consolidation:</b> Regroupez vos SKU dans des bacs temporaires. Le système optimisera les mouvements hors ligne pour minimiser la marche." },
        { keywords: ['shipping', 'palette', 'expedition'], answer: "<b>Expédition:</b> Créez d'abord votre expédition, puis générez une palette. Scannez vos colis pour les associer." }
    ],
    
    query(text) {
        const lowerText = text.toLowerCase();
        for (let item of this.kb) {
            if (item.keywords.some(kw => lowerText.includes(kw))) {
                return item.answer;
            }
        }
        return "Je ne trouve pas de réponse exacte dans ma base hors-ligne. Essayez des mots-clés comme 'remise', 'consolidation' ou 'shipping'.";
    },

    initUI() {
        const fab = document.getElementById('fab-ai');
        const panel = document.getElementById('ai-panel');
        const closeBtn = document.getElementById('close-ai');
        const sendBtn = document.getElementById('ai-send');
        const input = document.getElementById('ai-input');
        const chat = document.getElementById('ai-chat');

        fab.addEventListener('click', () => panel.classList.remove('hidden'));
        closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
        
        sendBtn.addEventListener('click', () => {
            const val = input.value.trim();
            if(!val) return;
            chat.innerHTML += `<div style="color:white; margin: 10px 0;"><b>Vous:</b> ${val}</div>`;
            const response = this.query(val);
            chat.innerHTML += `<div style="margin-bottom: 10px; padding-left: 10px; border-left: 2px solid var(--primary);"><b>IA:</b> ${response}</div>`;
            input.value = '';
            chat.scrollTop = chat.scrollHeight;
        });
    }
};
