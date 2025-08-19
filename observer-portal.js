// Observer Portal - Democracy Watch & Observers
let observerUser = null;
let selectedCounty = null;
let socket = null;
let stationsCache = [];
let currentForms = [];
let currentLogs = [];

// Init
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAuth();
  initExports();
});

function initTabs() {
  document.querySelectorAll('#observer-tabs .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      document.getElementById(`section-${section}`).classList.add('active');
      document.querySelectorAll('#observer-tabs .nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      if (section === 'map') renderMap();
    });
  });
}

function initAuth() {
  const form = document.getElementById('observer-login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('observer-id').value.trim();
    selectedCounty = document.getElementById('observer-county').value;
    const verified = document.getElementById('device-verified').checked;
    if (!id || !selectedCounty || !verified) {
      alert('Provide ID, county and verify device/location');
      return;
    }
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId: id, password: 'x', biometricData: 'ok', otp: '000000' })
      });
      if (!resp.ok) {
        const err = await resp.json();
        alert(`Login failed: ${err.error}`);
        return;
      }
      const data = await resp.json();
      localStorage.setItem('observer_token', data.token);
      observerUser = data.user;
      document.getElementById('observer-org').textContent = `Org: ${id.includes('002') ? 'ELOG' : 'Global Democracy Coalition'}`;
      document.getElementById('observer-level').textContent = `Level: ${id.includes('002') ? 'senior' : 'analyst'}`;
      initSocket();
      await loadSnapshot();
      await loadStations();
      await setupLogbook();
      await loadForms();
      await loadInsights();
      setupComms();
    } catch (e2) {
      console.error(e2);
      alert('Login error');
    }
  });
}

function authHeader() {
  const token = localStorage.getItem('observer_token');
  return { 'Authorization': `Bearer ${token}` };
}

function initSocket() {
  socket = io();
  socket.emit('join-observer-region', { county: selectedCounty });
  socket.on('observer-chat', (msg) => addChatMessage(msg));
  socket.on('observer-log:new', (log) => prependLog(log));
  socket.on('observer-flag:new', (flag) => addBroadcast(`New flag ${flag.id} for form ${flag.formId}`));
}

async function loadSnapshot() {
  const resp = await fetch(`/api/observer/overview?county=${encodeURIComponent(selectedCounty)}`, { headers: authHeader() });
  const data = await resp.json();
  const m = data.metrics;
  document.getElementById('metric-active').textContent = m.observersActive;
  document.getElementById('metric-reports').textContent = m.observationReports;
  document.getElementById('metric-green').textContent = `${m.greenRatedStations}%`;
  document.getElementById('metric-red').textContent = m.redFlaggedLocations;
  document.getElementById('metric-mismatch').textContent = m.formsFlaggedForMismatch;
  document.getElementById('metric-coverage').textContent = m.avgCoveragePerHour;
}

async function loadStations() {
  const resp = await fetch(`/api/observer/stations?county=${encodeURIComponent(selectedCounty)}`, { headers: authHeader() });
  stationsCache = await resp.json();
  const sel1 = document.getElementById('log-station');
  const sel2 = document.getElementById('forms-station');
  sel1.innerHTML = '';
  sel2.innerHTML = '';
  stationsCache.forEach(s => {
    const opt1 = document.createElement('option'); opt1.value = s.id; opt1.textContent = `${s.name} (${s.id})`; sel1.appendChild(opt1);
    const opt2 = document.createElement('option'); opt2.value = s.id; opt2.textContent = `${s.name} (${s.id})`; sel2.appendChild(opt2);
  });
  renderMap();
}

let mapInstance = null;
function renderMap() {
  const el = document.getElementById('observer-map');
  if (!el) return;
  if (!mapInstance) {
    mapInstance = L.map('observer-map').setView([-1.29, 36.82], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(mapInstance);
  }
  // Clear markers
  if (window._observerMarkers) {
    window._observerMarkers.forEach(m => m.remove());
  }
  window._observerMarkers = [];
  stationsCache.forEach(s => {
    if (!s.coordinates) return;
    const color = s.status === 'open' ? 'green' : s.status === 'closed' ? 'red' : 'orange';
    const marker = L.circleMarker([s.coordinates.lat, s.coordinates.lng], { radius: 8, color }).addTo(mapInstance);
    marker.bindPopup(`<strong>${s.name}</strong><br/>Status: ${s.status}<br/>Turnout: ${s.turnout || '-'}%`);
    window._observerMarkers.push(marker);
  });
}

async function setupLogbook() {
  const form = document.getElementById('observation-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData();
    const stationId = document.getElementById('log-station').value;
    const category = document.getElementById('log-category').value;
    const rating = document.getElementById('log-rating').value;
    const ratingTag = document.getElementById('log-tag').value;
    const confidential = document.getElementById('log-confidential').value;
    const notes = document.getElementById('log-notes').value;
    const evidenceFiles = document.getElementById('log-evidence').files;

    fd.append('stationId', stationId);
    const s = stationsCache.find(x => x.id === stationId);
    fd.append('county', selectedCounty);
    fd.append('constituency', s ? (s.constituency || '') : '');
    fd.append('ward', s ? (s.ward || '') : '');
    fd.append('category', category);
    fd.append('rating', rating);
    fd.append('ratingTag', ratingTag);
    fd.append('notes', notes);
    fd.append('confidential', confidential);
    // Simulate lat/lng; in production use geolocation
    fd.append('lat', s && s.coordinates ? s.coordinates.lat : -1.29);
    fd.append('lng', s && s.coordinates ? s.coordinates.lng : 36.82);
    for (let i = 0; i < evidenceFiles.length; i++) {
      fd.append('evidence', evidenceFiles[i]);
    }
    const resp = await fetch('/api/observer/logs', { method: 'POST', headers: authHeader(), body: fd });
    if (!resp.ok) { alert('Failed to submit log'); return; }
    const json = await resp.json();
    prependLog(json.log);
    form.reset();
    alert('Observation submitted');
  });
}

function prependLog(log) {
  currentLogs.unshift(log);
  const list = document.getElementById('logs-list');
  const div = document.createElement('div');
  const tagClass = log.ratingTag === 'red' ? 'flag-red' : (log.ratingTag === 'amber' ? 'flag-amber' : 'flag-green');
  div.className = 'border rounded p-2 mb-2';
  div.innerHTML = `<div class="d-flex justify-content-between"><strong>${log.stationId}</strong><span class="${tagClass}">${log.ratingTag || '-'}</span></div>
  <div class="small text-muted">${new Date(log.createdAt).toLocaleString()} • ${log.organization}</div>
  <div>${log.notes || ''}</div>`;
  list.prepend(div);
}

async function loadForms() {
  const stationId = document.getElementById('forms-station').value || '';
  const url = stationId ? `/api/observer/forms?county=${encodeURIComponent(selectedCounty)}&stationId=${encodeURIComponent(stationId)}` : `/api/observer/forms?county=${encodeURIComponent(selectedCounty)}`;
  const resp = await fetch(url, { headers: authHeader() });
  currentForms = await resp.json();
  const f = currentForms[0];
  const photo = document.getElementById('form-photo');
  const data = document.getElementById('form-data');
  if (f) {
    photo.textContent = '';
    const img = document.createElement('div');
    img.textContent = f.photoUrl ? `Image: ${f.photoUrl}` : 'No image';
    photo.appendChild(img);
    data.textContent = JSON.stringify(f.typedData || f, null, 2);
  } else {
    photo.textContent = 'No forms available';
    data.textContent = '{}';
  }
  document.getElementById('forms-station').addEventListener('change', loadForms);
  document.getElementById('flag-mismatch').addEventListener('click', flagSelectedForm);
}

async function flagSelectedForm() {
  const f = currentForms[0];
  if (!f) { alert('No form to flag'); return; }
  const reason = prompt('Describe the mismatch reason');
  if (!reason) return;
  const resp = await fetch('/api/observer/flags', {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ formId: f.id, reason, details: '', county: selectedCounty })
  });
  if (!resp.ok) { alert('Failed to flag form'); return; }
  alert('Form flagged for review');
}

async function loadInsights() {
  const resp = await fetch(`/api/observer/insights?county=${encodeURIComponent(selectedCounty)}`, { headers: authHeader() });
  const insights = await resp.json();
  const container = document.getElementById('insights-cards');
  container.innerHTML = '';
  insights.forEach(i => {
    const col = document.createElement('div');
    col.className = 'col-md-6';
    col.innerHTML = `
      <div class="p-3 border rounded">
        <div class="d-flex justify-content-between"><span>Women participation</span><strong>${i.womenParticipationPct}%</strong></div>
        <div class="d-flex justify-content-between"><span>Youth participation</span><strong>${i.youthParticipationPct}%</strong></div>
        <div class="d-flex justify-content-between"><span>Disabled access reports</span><strong>${i.disabledAccessReports}</strong></div>
        <div class="d-flex justify-content-between"><span>Risk score</span><strong>${i.riskScore}</strong></div>
        <div class="text-muted small mt-1">Updated: ${new Date(i.lastUpdated).toLocaleString()}</div>
      </div>`;
    container.appendChild(col);
  });
}

function setupComms() {
  document.getElementById('chat-send').addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;
    const msg = { county: selectedCounty, user: observerUser?.id || 'observer', text };
    socket.emit('observer-chat', msg);
    input.value = '';
  });
  addBroadcast('Welcome to the observer county room. Coordinate ethically.');
  // Simple demo tasks
  const tasks = [
    'Visit 3 stations today',
    'Upload photos before 6pm',
    'Mark any red flags immediately'
  ];
  const ul = document.getElementById('task-board');
  tasks.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
}

function addChatMessage(msg) {
  const box = document.getElementById('chat-box');
  const div = document.createElement('div');
  div.className = 'mb-1';
  const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
  div.innerHTML = `<strong>${msg.user || 'observer'}</strong> <span class="text-muted small">${time}</span><br/>${msg.text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function addBroadcast(text) {
  const b = document.getElementById('broadcasts');
  const div = document.createElement('div');
  div.className = 'alert alert-info p-2';
  div.textContent = text;
  b.prepend(div);
}

function initExports() {
  document.getElementById('export-logs').addEventListener('click', () => {
    window.location = `/api/observer/export/logs.csv?county=${encodeURIComponent(selectedCounty)}`;
  });
  document.getElementById('generate-pdf').addEventListener('click', () => {
    alert('PDF generation template placeholder. Integrate jsPDF in production.');
  });
}