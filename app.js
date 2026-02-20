const STORAGE_KEY = "dlwms_state_v1";
const ORDER = [
  "g1", "lavmontage", "lavpickup", "lavreception", "scrap", "lavretour", "g7", "g2", "g4",
  "lavstorage", "lavcage", "g0", "g3", "g5", "lavmezzanine", "g6", "lavremise"
];

const state = loadState();
let selectedItemCode = null;

const itemScanInput = document.getElementById("itemScanInput");
const addItemBtn = document.getElementById("addItemBtn");
const manualToggle = document.getElementById("manualToggle");
const manualRow = document.getElementById("manualRow");
const manualQty = document.getElementById("manualQty");
const manualAddBtn = document.getElementById("manualAddBtn");
const activeList = document.getElementById("activeList");
const itemActionDialog = document.getElementById("itemActionDialog");
const dialogItemTitle = document.getElementById("dialogItemTitle");
const completeBtn = document.getElementById("completeBtn");
const archiveList = document.getElementById("archiveList");
const nextRunInfo = document.getElementById("nextRunInfo");
const processScanInput = document.getElementById("processScanInput");
const processScanBtn = document.getElementById("processScanBtn");
const forceBtn = document.getElementById("forceBtn");
const statusBanner = document.getElementById("statusBanner");

manualToggle.addEventListener("click", () => manualRow.classList.toggle("hidden"));
addItemBtn.addEventListener("click", () => addScan(itemScanInput.value.trim(), 1, false));
manualAddBtn.addEventListener("click", () => {
  const qty = Number.parseInt(manualQty.value, 10);
  addScan(itemScanInput.value.trim(), Number.isNaN(qty) ? 1 : qty, true);
});
completeBtn.addEventListener("click", completeCurrentBatch);
processScanBtn.addEventListener("click", () => processScan(processScanInput.value.trim()));
forceBtn.addEventListener("click", forceCurrentStep);

itemActionDialog.addEventListener("close", () => {
  const action = itemActionDialog.returnValue;
  if (!selectedItemCode || !action || action === "cancel") return;
  if (action === "delete") {
    if (!confirm("Confirmer suppression explicite ?")) return;
    removeItem(selectedItemCode, "delete");
    return;
  }
  if (action === "rebox") {
    markRebox(selectedItemCode);
    return;
  }
  if (action === "scrap") {
    const scrapBin = prompt("Scanner/entrer Bac Scrap (obligatoire)");
    if (!scrapBin) return alert("Bac scrap obligatoire");
    archiveScrap(selectedItemCode, scrapBin);
  }
});

for (const btn of itemActionDialog.querySelectorAll("button[data-action]")) {
  btn.addEventListener("click", () => itemActionDialog.close(btn.dataset.action));
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");

render();
updateOnlineStatus();

function loadState() {
  const fallback = {
    active: [],
    archives: [],
    counters: { remise: 1, panier: 1 },
    work: null
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addScan(code, qty, forcedManual) {
  if (!code) return alert("Scan ITEM obligatoire");
  if (qty < 1) return;
  const existing = state.active.find((i) => i.code === code);
  const zone = inferZone(code);
  if (existing) {
    existing.qty += qty;
    if (forcedManual) existing.logs.push(log("manual-entry", { qty }));
  } else {
    state.active.push({ code, qty, zone, status: "active", logs: [log("item-scan", { qty })] });
    if (forcedManual) state.active.at(-1).logs.push(log("manual-entry", { qty }));
  }
  itemScanInput.value = "";
  persist();
  render();
}

function removeItem(code, reason) {
  const idx = state.active.findIndex((i) => i.code === code);
  if (idx < 0) return;
  const [removed] = state.active.splice(idx, 1);
  removed.logs.push(log("removed", { reason }));
  state.archives.push({
    id: `TMPDEL${Date.now()}`,
    type: "action",
    createdAt: new Date().toISOString(),
    immutable: true,
    items: [removed],
    logs: removed.logs
  });
  persist();
  render();
}

function markRebox(code) {
  const item = state.active.find((i) => i.code === code);
  if (!item) return;
  item.status = "rebox";
  item.zone = "lavremise";
  item.logs.push(log("rebox", { note: "Traiter fin de parcours" }));
  persist();
  render();
}

function archiveScrap(code, scrapBin) {
  const idx = state.active.findIndex((i) => i.code === code);
  if (idx < 0) return;
  const [item] = state.active.splice(idx, 1);
  const details = {
    user: "operator-local",
    zone: item.zone,
    scrapBin,
    time: new Date().toISOString()
  };
  item.logs.push(log("scrap", details));
  state.archives.push({
    id: `SCRAP${Date.now()}`,
    type: "scrap",
    createdAt: new Date().toISOString(),
    immutable: true,
    items: [item],
    logs: item.logs
  });
  persist();
  render();
}

function completeCurrentBatch() {
  if (!state.active.length) return alert("Aucun item à compléter");
  const id = `LAVREM${String(state.counters.remise).padStart(4, "0")}`;
  state.counters.remise += 1;

  const sorted = [...state.active].sort((a, b) => zoneIndex(a.zone) - zoneIndex(b.zone));
  const archive = {
    id,
    type: "remise",
    createdAt: new Date().toISOString(),
    immutable: true,
    routeOrder: ORDER,
    items: sorted.map((i) => ({ ...i, remaining: i.qty, confirmed: 0 })),
    logs: [log("batch-completed", { count: sorted.length })]
  };

  state.archives.push(archive);
  state.work = {
    archiveId: id,
    cursor: 0,
    expecting: "item",
    currentScanCount: 0,
    forceLog: []
  };
  state.active = [];
  persist();
  render();
}

function processScan(scan) {
  if (!state.work) return alert("Aucune remise active");
  if (!scan) return;

  const archive = state.archives.find((a) => a.id === state.work.archiveId);
  if (!archive) return;

  const item = archive.items[state.work.cursor];
  if (!item) return;

  if (state.work.expecting === "item") {
    if (scan !== item.code) return setInfo(`Erreur scan ITEM attendu: ${item.code}`, true);
    item.confirmed += 1;
    state.work.currentScanCount += 1;
    setInfo(item.qty === 1 ? "Produit confirmé. Scanner BIN." : `Pièce ${item.confirmed}/${item.qty} confirmée.`);
    if (item.confirmed >= item.qty) {
      state.work.expecting = "bin";
    }
  } else {
    const expected = expectedBin(item);
    if (scan !== expected) return setInfo(`BIN incorrect. Attendu: ${expected}`, true);
    item.remaining = 0;
    archive.logs.push(log("item-complete", { code: item.code, bin: scan }));
    setInfo("Remise complète ✅");
    moveNextItem(archive);
  }

  processScanInput.value = "";
  persist();
  render();
}

function forceCurrentStep() {
  if (!state.work) return;
  const reason = prompt("Justification obligatoire pour forçage");
  if (!reason) return alert("Forçage refusé sans justification");
  const archive = state.archives.find((a) => a.id === state.work.archiveId);
  const item = archive?.items[state.work.cursor];
  if (!item) return;

  if (state.work.expecting === "item") {
    item.confirmed = item.qty;
    state.work.expecting = "bin";
  } else {
    item.remaining = 0;
    moveNextItem(archive);
  }
  state.work.forceLog.push(log("force", { reason, code: item.code, step: state.work.expecting }));
  archive.logs.push(log("force", { reason, code: item.code }));
  setInfo("Forçage appliqué (journalisé)");
  persist();
  render();
}

function moveNextItem(archive) {
  state.work.cursor += 1;
  state.work.expecting = "item";
  state.work.currentScanCount = 0;
  if (state.work.cursor >= archive.items.length) {
    archive.logs.push(log("run-complete", { message: "retour lavremise" }));
    state.work = null;
    setInfo("Parcours terminé. Retour lavremise.");
  }
}

function render() {
  activeList.innerHTML = "";
  const ordered = [...state.active].sort((a, b) => zoneIndex(a.zone) - zoneIndex(b.zone));
  for (const item of ordered) {
    const li = document.createElement("li");
    li.innerHTML = `<span>${item.code} · x${item.qty}<span class="tag">${item.zone}</span>${item.status === "rebox" ? '<span class="tag">REBOX</span>' : ''}</span><button>Actions</button>`;
    li.querySelector("button").addEventListener("click", () => {
      selectedItemCode = item.code;
      dialogItemTitle.textContent = `Action: ${item.code}`;
      itemActionDialog.showModal();
    });
    activeList.append(li);
  }

  archiveList.innerHTML = state.archives
    .slice()
    .reverse()
    .map((a) => `<article><strong>${a.id}</strong> · ${a.type} · ${new Date(a.createdAt).toLocaleString("fr-CA")}
      <div>${a.items.length} item(s), figé=${a.immutable ? "oui" : "non"}</div></article><hr/>`)
    .join("");

  if (!state.work) {
    nextRunInfo.textContent = "Aucune remise à traiter.";
    return;
  }

  const archive = state.archives.find((a) => a.id === state.work.archiveId);
  const item = archive?.items[state.work.cursor];
  if (!item) {
    nextRunInfo.textContent = "Remise terminée.";
    return;
  }

  nextRunInfo.innerHTML = `Remise <b>${archive.id}</b> · Étape ${state.work.cursor + 1}/${archive.items.length}<br/>
  Item: <b>${item.code}</b> · Qté: ${item.qty} · Attendu: ${state.work.expecting.toUpperCase()} (${state.work.expecting === "bin" ? expectedBin(item) : item.code})`;
}

function log(event, payload) {
  return { event, payload, at: new Date().toISOString() };
}

function zoneIndex(zone) {
  const idx = ORDER.indexOf((zone || "").toLowerCase());
  return idx === -1 ? ORDER.length + 1 : idx;
}

function inferZone(code) {
  const z = code.toLowerCase().split("-")[0];
  return ORDER.includes(z) ? z : "lavreception";
}

function expectedBin(item) {
  return `BIN-${item.zone.toUpperCase()}`;
}

function setInfo(message, isError = false) {
  nextRunInfo.textContent = message;
  nextRunInfo.className = isError ? "info err" : "info ok";
}

function updateOnlineStatus() {
  statusBanner.textContent = navigator.onLine ? "En ligne" : "Mode hors ligne prêt";
  statusBanner.className = navigator.onLine ? "banner" : "banner";
}
