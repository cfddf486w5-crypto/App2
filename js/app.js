const STORAGE_KEY = 'cancellation-archives-v1';

const WORKFLOW = [
  'Demande créée',
  'Notification reçue pour traiter la demande',
  'Demande acceptée',
  'Commande trouvée et retirée',
  'Cancellation créée',
  'Photo du bon de cancellation prise',
  'Demande envoyée par Outlook',
  'Traitée au site',
  'Archive finale'
];

const form = document.getElementById('cancel-form');
const reasonSelect = document.getElementById('reason');
const otherReasonWrap = document.getElementById('otherReasonWrap');
const otherReason = document.getElementById('otherReason');
const archiveList = document.getElementById('archiveList');
const archiveCount = document.getElementById('archiveCount');
const archiveTemplate = document.getElementById('archiveTemplate');

const loadArchives = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
const saveArchives = (archives) => localStorage.setItem(STORAGE_KEY, JSON.stringify(archives));

const statusInfo = (step) => {
  if (step >= WORKFLOW.length - 1) {
    return { label: 'Finalisée', className: 'done' };
  }
  if (step > 0) {
    return { label: 'En traitement', className: 'progress' };
  }
  return { label: 'En attente', className: 'pending' };
};

const renderArchives = () => {
  const archives = loadArchives();
  archiveList.innerHTML = '';
  archiveCount.textContent = `${archives.length} demande${archives.length > 1 ? 's' : ''}`;

  if (!archives.length) {
    archiveList.innerHTML = '<p class="meta">Aucune archive pour le moment.</p>';
    return;
  }

  archives
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach((archive) => {
      const node = archiveTemplate.content.cloneNode(true);
      const status = statusInfo(archive.step);

      node.querySelector('h3').textContent = `${archive.orderNumber} • ${archive.site}`;
      const statusTag = node.querySelector('.status');
      statusTag.textContent = status.label;
      statusTag.classList.add(status.className);

      node.querySelector('.meta').textContent = `Client: ${archive.customerNumber} • Créée: ${new Date(archive.createdAt).toLocaleString('fr-CA')}`;
      node.querySelector('.reason').textContent = `Raison: ${archive.reason}`;

      const timeline = node.querySelector('.timeline');
      WORKFLOW.forEach((item, index) => {
        const li = document.createElement('li');
        li.textContent = item;
        if (index <= archive.step) li.classList.add('done');
        timeline.appendChild(li);
      });

      const actions = node.querySelector('.actions');
      if (archive.step < WORKFLOW.length - 1) {
        const button = document.createElement('button');
        button.textContent = `Passer à: ${WORKFLOW[archive.step + 1]}`;
        button.addEventListener('click', () => {
          const all = loadArchives();
          const idx = all.findIndex((x) => x.id === archive.id);
          if (idx === -1) return;
          all[idx].step += 1;

          if (WORKFLOW[all[idx].step] === 'Traitée au site') {
            all[idx].treatedAt = all[idx].site;
          }

          saveArchives(all);
          renderArchives();
        });
        actions.appendChild(button);
      }

      if (archive.treatedAt) {
        const treated = document.createElement('span');
        treated.className = 'badge';
        treated.textContent = `Update traitée à ${archive.treatedAt}`;
        actions.appendChild(treated);
      }

      archiveList.appendChild(node);
    });
};

reasonSelect.addEventListener('change', () => {
  const isOther = reasonSelect.value === 'Autre';
  otherReasonWrap.classList.toggle('hidden', !isOther);
  otherReason.required = isOther;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const payload = {
    id: crypto.randomUUID(),
    orderNumber: document.getElementById('orderNumber').value.trim(),
    customerNumber: document.getElementById('customerNumber').value.trim(),
    site: document.getElementById('site').value,
    reason: reasonSelect.value === 'Autre' ? `Autre: ${otherReason.value.trim()}` : reasonSelect.value,
    step: 0,
    createdAt: new Date().toISOString(),
    treatedAt: null
  };

  const archives = loadArchives();
  archives.push(payload);
  saveArchives(archives);

  form.reset();
  otherReasonWrap.classList.add('hidden');
  otherReason.required = false;

  renderArchives();
});

renderArchives();
