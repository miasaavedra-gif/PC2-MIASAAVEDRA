import { DISTRICTS, STATUS_LABELS, filterReports, normalizeReport, reportStats } from './domain.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const ADMIN_EMAIL = 'mia.saavedra@usil.pe';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const appState = {
  reports: [], filter: 'all', district: 'all', mainMap: null, miniMap: null,
  supabase: null, user: null, isAdmin: false, staffMode: false, authMode: 'login'
};
const localKey = 'alertavecinal-reports-v2';

function dateLabel(value) {
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short' }).format(new Date(value)).replace('.', '');
}
function statusClass(status) {
  return status === 'resolved' ? 'status-resolved' : status === 'in_progress' ? 'status-progress' : 'status-open';
}
function statusMarkup(status) {
  return '<span class="status-pill ' + statusClass(status) + '"><i></i>' + (STATUS_LABELS[status] || 'Abierto') + '</span>';
}
function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function reportRow(report) {
  const statusCell = appState.staffMode
    ? '<select class="inline-status" aria-label="Cambiar estado de ' + escapeHtml(report.title) + '" data-report-id="' + escapeHtml(report.id) + '">' +
      ['open', 'in_progress', 'resolved'].map((status) => '<option value="' + status + '" ' + (report.status === status ? 'selected' : '') + '>' + STATUS_LABELS[status] + '</option>').join('') + '</select>'
    : statusMarkup(report.status);
  return '<tr><td><div class="report-title"><span class="report-pin ' + statusClass(report.status) + '">⌖</span><div><b>' +
    escapeHtml(report.title) + '</b><small>' + escapeHtml(report.location) + '</small></div></div></td><td>' +
    escapeHtml(report.district) + '</td><td><span class="kind-label">' + escapeHtml(report.kind) + '</span></td><td>' +
    statusCell + '</td><td class="date-cell">' + dateLabel(report.created_at) + '</td></tr>';
}
async function connectBackend() {
  if (appState.supabase) return appState.supabase;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    appState.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    appState.supabase.auth.onAuthStateChange((_event, session) => {
      appState.user = session?.user || null;
      void refreshAccess();
    });
    const { data } = await appState.supabase.auth.getSession();
    appState.user = data?.session?.user || null;
    await refreshAccess();
    return appState.supabase;
  } catch (error) {
    console.warn('No fue posible conectar con Supabase.', error?.message || error);
    return null;
  }
}
async function refreshAccess() {
  const email = String(appState.user?.email || '').toLowerCase();
  const verified = Boolean(appState.user?.email_confirmed_at || appState.user?.confirmed_at);
  appState.isAdmin = email === ADMIN_EMAIL && verified;
  appState.staffMode = appState.isAdmin;
  if (appState.user && !appState.isAdmin && appState.supabase) {
    const { data, error } = await appState.supabase
      .from('municipal_staff').select('user_id').eq('user_id', appState.user.id).maybeSingle();
    appState.staffMode = !error && Boolean(data);
  }
  updateAccessUI();
  if ($('#recent-rows')) renderTables();
}
function updateAccessUI() {
  const planLink = document.querySelector('.nav-item[data-view="plan"]');
  if (planLink) planLink.hidden = !appState.isAdmin;
  const planView = $('#view-plan');
  if (planView) planView.hidden = !appState.isAdmin;
  const profile = $('.profile-mini');
  if (profile) {
    const title = profile.querySelector('b');
    const subtitle = profile.querySelector('small');
    if (title) title.textContent = appState.isAdmin ? 'Administradora' : appState.user ? 'Cuenta vecinal' : 'Panel ciudadano';
    if (subtitle) subtitle.textContent = appState.user?.email || 'Acceso comunitario';
  }
  const button = $('#auth-btn');
  if (button) {
    button.textContent = appState.user ? 'Cerrar sesión ↗' : 'Iniciar sesión ↗';
    button.classList.toggle('authorized', appState.staffMode);
  }
  if (!appState.isAdmin && $('#view-plan')?.classList.contains('active')) openView('inicio');
}
async function loadReports() {
  const client = await connectBackend();
  if (client) {
    const { data, error } = await client.from('reports').select('*').order('created_at', { ascending: false }).limit(100);
    if (!error) {
      appState.reports = data || [];
      return;
    }
    console.warn('No se pudieron cargar reportes desde Supabase.', error.message);
  }
  try { appState.reports = JSON.parse(localStorage.getItem(localKey) || '[]'); }
  catch { appState.reports = []; }
}
function renderTables() {
  const recent = [...appState.reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  $('#recent-rows').innerHTML = recent.map(reportRow).join('');
  const shown = filterReports(appState.reports, {
    query: $('#report-search')?.value || '',
    status: $('#report-status-filter')?.value || 'all',
    district: appState.district
  });
  $('#all-rows').innerHTML = shown.map(reportRow).join('');
  $('#empty-state').classList.toggle('hidden', shown.length > 0);
  $('#nav-count').textContent = appState.reports.length;
  $('#map-total').textContent = appState.reports.length;
  document.querySelectorAll('[data-report-id]').forEach((el) =>
    el.addEventListener('change', () => changeStatus(el.dataset.reportId, el.value)));
}
function renderStats() {
  const stats = reportStats(appState.reports);
  $('#metric-open').textContent = stats.open;
  $('#metric-done').textContent = stats.done;
  $('#metric-neighbors').textContent = stats.neighbors;
  const counts = DISTRICTS.map((district) => ({ name: district, count: appState.reports.filter((r) => r.district === district).length }));
  const max = Math.max(1, ...counts.map((item) => item.count));
  $('#district-bars').innerHTML = counts.map((item) =>
    '<div class="district-row"><div class="district-label"><span>' + escapeHtml(item.name) + '</span><b>' + item.count +
    '</b></div><div class="bar-track"><i style="width:' + Math.max(7, Math.round(item.count / max * 100)) + '%"></i></div></div>').join('');
}
function initMap(el, zoom, center = [-11.985, -77.067]) {
  if (!window.L || !el || el._leaflet_id) return null;
  const map = L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView(center, zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 19
  }).addTo(map);
  return map;
}
function drawPins(map, reports = appState.reports) {
  if (!map) return;
  map.eachLayer((layer) => { if (layer instanceof L.Marker) map.removeLayer(layer); });
  const selected = filterReports(reports, { status: appState.filter, district: appState.district });
  selected.forEach((report) => {
    const klass = statusClass(report.status);
    const icon = L.divIcon({ className: '', html: '<div class="custom-pin ' + klass + '"><span>⌖</span></div>', iconSize: [34, 40], iconAnchor: [17, 35] });
    L.marker([report.lat, report.lng], { icon }).addTo(map)
      .bindPopup('<b>' + escapeHtml(report.title) + '</b><br>' + escapeHtml(report.district) + ' · ' + escapeHtml(STATUS_LABELS[report.status] || 'Abierto'));
  });
}
function mapsRefresh() { drawPins(appState.miniMap); drawPins(appState.mainMap); }
function initPlan() {
  const sprints = [
    ['Sprint 1', '23 nov - 4 dic', 'Base segura y diseño', '21 pts'],
    ['Sprint 2', '7 - 18 dic', 'Reportar y ubicar', '26 pts'],
    ['Sprint 3', '21 dic - 1 ene', 'Seguimiento municipal', '24 pts'],
    ['Sprint 4', '4 - 15 ene', 'Indicadores y entrega', '23 pts']
  ];
  $('#sprint-strip').innerHTML = sprints.map((s, i) =>
    '<article class="sprint-card ' + (i === 3 ? 'sprint-current' : '') + '"><div class="sprint-num">0' + (i + 1) +
    '</div><div><small>' + s[1] + '</small><b>' + s[0] + '</b><span>' + s[2] + '</span></div><strong>' + s[3] + '</strong></article>').join('');
  const lanes = [
    ['To Do', 4, ['AV-13 Validar ubicación', 'AV-17 Accesibilidad', 'AV-20 Exportar datos']],
    ['In Progress', 3, ['AV-11 Registrar incidencia', 'AV-14 Mapa de puntos']],
    ['In Review', 2, ['AV-18 Controles RLS', 'AV-19 Pruebas del flujo']],
    ['Done', 5, ['AV-01 Diseño del sistema', 'AV-04 Ver reportes', 'AV-08 Filtrar por zona']]
  ];
  $('#kanban-board').innerHTML = lanes.map((lane) =>
    '<div class="kanban-lane"><div class="lane-head"><span>' + lane[0] + '</span><b>' + lane[1] +
    '</b></div><div class="wip">WIP · ' + (lane[0] === 'In Progress' ? 3 : lane[0] === 'In Review' ? 2 : '-') + '</div>' +
    lane[2].map((item, i) => '<div class="kanban-card"><small>' + (i % 2 ? 'Backend' : 'Producto') + ' · ' + (i + 2) +
      ' pts</small><b>' + item + '</b><span class="kanban-person">' + ['AV', 'LN', 'CM'][i] + '</span></div>').join('') + '</div>').join('');
  const rows = [
    ['Épica 1 · Reportar', 'Reporte vecinal', 0, 35], ['Épica 2 · Ubicar', 'Mapa colaborativo', 12, 54],
    ['Épica 3 · Atender', 'Gestión municipal', 35, 77], ['Épica 4 · Medir', 'Indicadores', 60, 100]
  ];
  $('#gantt-chart').innerHTML = '<div class="gantt-months"><span>23 NOV</span><span>7 DIC</span><span>21 DIC</span><span>4 ENE</span><span>15 ENE</span></div>' +
    rows.map((row, i) => '<div class="gantt-row"><div>' + row[0] + '<small>' + row[1] + '</small></div><div class="gantt-track"><i class="gantt-bar bar-' +
      (i + 1) + '" style="left:' + row[2] + '%;width:' + (row[3] - row[2]) + '%">' + ['S1 · S2', 'S1 · S3', 'S2 · S4', 'S3 · S4'][i] + '</i></div></div>').join('');
  const canvas = $('#burndown'), ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.clientWidth * devicePixelRatio, height = canvas.height = 210 * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = canvas.clientWidth, h = 210;
  ctx.clearRect(0, 0, w, h); ctx.strokeStyle = '#e8eeeb'; ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 18 + i * 39; ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(w - 8, y); ctx.stroke();
    ctx.fillStyle = '#84918c'; ctx.font = '11px DM Sans'; ctx.fillText(String(23 - i * 5), 4, y + 4);
  }
  const draw = (values, color, dash = []) => {
    ctx.beginPath(); ctx.setLineDash(dash); ctx.strokeStyle = color; ctx.lineWidth = 2.5;
    values.forEach((value, i) => {
      const x = 38 + i * (w - 55) / (values.length - 1), y = 18 + (23 - value) / 23 * 156;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.stroke(); ctx.setLineDash([]);
  };
  draw([23, 19, 15, 11, 7, 3, 0], '#9daaa4', [5, 5]);
  draw([23, 21, 18, 14, 12, 7, 0], '#b6cf49');
}
function openView(name) {
  if (name === 'plan' && !appState.isAdmin) {
    toast('El plan del proyecto está disponible solo para administración.');
    return;
  }
  const labels = { plan: 'Plan del proyecto', mapa: 'Mapa de reportes', reportes: 'Reportes', inicio: 'Resumen' };
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === 'view-' + name));
  $$('.nav-item').forEach((button) => button.classList.toggle('active', button.dataset.view === name));
  $('#crumb-title').textContent = labels[name] || 'Resumen';
  if (name === 'plan') requestAnimationFrame(initPlan);
  if (name === 'mapa') {
    setTimeout(() => {
      if (!appState.mainMap) appState.mainMap = initMap($('#full-map'), 12);
      else appState.mainMap.invalidateSize();
      mapsRefresh();
    }, 80);
  }
}
function toast(message) {
  const element = $('#toast'); element.textContent = message; element.classList.remove('hidden');
  setTimeout(() => element.classList.add('hidden'), 3500);
}
async function changeStatus(id, status) {
  if (!appState.staffMode || !appState.supabase) {
    toast('Necesitas una cuenta autorizada de administración o gestión municipal.');
    renderTables(); return;
  }
  const { error } = await appState.supabase.from('reports').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) { toast('No se pudo cambiar el estado. Verifica el permiso de gestión.'); renderTables(); return; }
  await loadReports(); renderStats(); renderTables(); mapsRefresh(); toast('Estado del reporte actualizado.');
}
function openAuth() {
  $('#auth-message').textContent = '';
  $('#auth-message').classList.remove('error');
  $('#auth-modal').classList.remove('hidden');
  $('#auth-email').focus();
}
function setAuthMode(mode) {
  appState.authMode = mode;
  const signup = mode === 'signup';
  $('#auth-submit').textContent = signup ? 'Crear cuenta' : 'Iniciar sesión';
  $('#auth-password').autocomplete = signup ? 'new-password' : 'current-password';
  $('#auth-copy').textContent = signup
    ? 'Crea tu cuenta con correo y contraseña. La administración se asigna únicamente al correo autorizado.'
    : 'Entra con tu correo, con Google si el proveedor está configurado, o crea una cuenta vecinal.';
  $$('[data-auth-mode]').forEach((button) => button.classList.toggle('active', button.dataset.authMode === mode));
  $('#auth-message').textContent = '';
  $('#auth-message').classList.remove('error');
}
async function handleAuth() {
  if (!appState.supabase) { toast('No se pudo conectar con el servicio de acceso. Recarga e inténtalo de nuevo.'); return; }
  if (appState.user) {
    await appState.supabase.auth.signOut();
    appState.user = null; appState.isAdmin = false; appState.staffMode = false;
    updateAccessUI(); await loadReports(); renderStats(); renderTables(); mapsRefresh();
    toast('Sesión cerrada.'); return;
  }
  setAuthMode('login'); openAuth();
}
async function submitAuth(event) {
  event.preventDefault();
  const email = $('#auth-email').value.trim().toLowerCase();
  const password = $('#auth-password').value;
  const message = $('#auth-message');
  message.textContent = ''; message.classList.remove('error');
  const submit = $('#auth-submit');
  submit.disabled = true;
  try {
    if (appState.authMode === 'signup') {
      const { data, error } = await appState.supabase.auth.signUp({
        email, password, options: { emailRedirectTo: window.location.origin }
      });
      if (error) throw error;
      if (data.session) {
        $('#auth-modal').classList.add('hidden');
        toast('Cuenta creada. Ya puedes ingresar.');
      } else {
        message.textContent = 'Te enviamos un correo para verificar la cuenta antes de iniciar sesión.';
      }
    } else {
      const { error } = await appState.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      $('#auth-modal').classList.add('hidden');
      toast(email === ADMIN_EMAIL ? 'Acceso de administración iniciado.' : 'Sesión iniciada.');
    }
  } catch (error) {
    message.textContent = error.message || 'No se pudo completar el acceso.';
    message.classList.add('error');
  } finally {
    submit.disabled = false;
  }
}
async function signInWithGoogle() {
  const message = $('#auth-message');
  message.textContent = ''; message.classList.remove('error');
  const { error } = await appState.supabase.auth.signInWithOAuth({
    provider: 'google', options: { redirectTo: window.location.origin }
  });
  if (error) {
    message.textContent = 'Google aún requiere configurar el proveedor OAuth en Supabase. Puedes ingresar por correo mientras tanto.';
    message.classList.add('error');
  }
}
async function submitReport(event) {
  event.preventDefault();
  const form = event.currentTarget, values = Object.fromEntries(new FormData(form).entries());
  const message = $('#form-message');
  message.textContent = ''; message.classList.remove('error');
  try {
    const name = String(values.reporter_name || '').trim();
    const phone = String(values.contact_phone || '').trim();
    if (name.length < 2) throw new Error('Escribe tu nombre para que administración pueda dar seguimiento.');
    if (!/^[+0-9() -]{7,20}$/.test(phone)) throw new Error('Ingresa un teléfono válido, con código de país si corresponde.');
    if (!form.elements.contact_consent.checked) throw new Error('Confirma que administración puede usar tus datos solo para dar seguimiento.');
    const report = normalizeReport({ ...values, anonymous: true });
    if (appState.supabase) {
      const { error } = await appState.supabase.rpc('submit_report', {
        p_title: report.title, p_location: report.location, p_district: report.district,
        p_kind: report.kind, p_lat: report.lat, p_lng: report.lng,
        p_reporter_name: name, p_contact_phone: phone
      });
      if (error) throw new Error('No se pudo guardar. Revisa los campos y vuelve a intentar.');
    } else {
      throw new Error('El servicio de reportes no está disponible. Inténtalo cuando vuelva la conexión segura.');
    }
    await loadReports(); renderStats(); renderTables(); mapsRefresh();
    $('#report-modal').classList.add('hidden'); form.reset();
    toast('Reporte enviado. Tus datos quedaron privados para el seguimiento.');
  } catch (error) {
    message.textContent = error.message; message.classList.add('error');
  }
}
function showReportModal() {
  $('#form-message').textContent = ''; $('#form-message').classList.remove('error');
  $('#report-modal').classList.remove('hidden'); $('#report-form').elements.reporter_name.focus();
}
function initialize() {
  $('#today').textContent = new Intl.DateTimeFormat('es-PE', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date()).replace('.', '');
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => openView(button.dataset.view)));
  $$('[data-view]').filter((el) => !el.classList.contains('nav-item')).forEach((button) => button.addEventListener('click', () => openView(button.dataset.view)));
  $$('[data-open-report]').forEach((button) => button.addEventListener('click', showReportModal));
  $('#close-modal').addEventListener('click', () => $('#report-modal').classList.add('hidden'));
  $('#report-modal').addEventListener('click', (event) => { if (event.target.id === 'report-modal') event.currentTarget.classList.add('hidden'); });
  $('#report-form').addEventListener('submit', submitReport);
  $('#report-search').addEventListener('input', renderTables);
  $('#report-status-filter').addEventListener('change', renderTables);
  $('#district-filter').addEventListener('change', (event) => { appState.district = event.target.value; mapsRefresh(); });
  $$('.chip').forEach((button) => button.addEventListener('click', () => {
    $$('.chip').forEach((item) => item.classList.remove('active'));
    button.classList.add('active'); appState.filter = button.dataset.filter; mapsRefresh();
  }));
  $('#locate-btn').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Tu navegador no permite obtener ubicación.'); return; }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      $('#report-form').elements.lat.value = coords.latitude.toFixed(6);
      $('#report-form').elements.lng.value = coords.longitude.toFixed(6);
      toast('Ubicación agregada al reporte.');
    }, () => toast('No se pudo obtener la ubicación. Revisa los permisos.'), { enableHighAccuracy: true, timeout: 8000 });
  });
  $('#help-btn').addEventListener('click', () => toast('Registra el punto. Tu nombre y teléfono solo los verá el equipo autorizado.'));
  window.addEventListener('resize', () => { if (appState.mainMap) appState.mainMap.invalidateSize(); });
  $('#auth-btn').addEventListener('click', handleAuth);
  $('#close-auth').addEventListener('click', () => $('#auth-modal').classList.add('hidden'));
  $('#auth-modal').addEventListener('click', (event) => { if (event.target.id === 'auth-modal') event.currentTarget.classList.add('hidden'); });
  $('#auth-form').addEventListener('submit', submitAuth);
  $('#google-signin').addEventListener('click', signInWithGoogle);
  $$('[data-auth-mode]').forEach((button) => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
  void connectBackend().then(async () => {
    await loadReports(); await refreshAccess(); renderStats(); renderTables();
    appState.miniMap = initMap($('#mini-map'), 12); mapsRefresh();
  });
}
initialize();
