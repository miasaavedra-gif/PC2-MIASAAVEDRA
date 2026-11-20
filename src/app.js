import { DISTRICTS, STATUS_LABELS, filterReports, normalizeReport, reportStats } from './domain.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const seed = [
  { id:'AV-104', title:'Heces acumuladas junto al ingreso del parque', location:'Parque Los Jazmines · puerta norte', district:'Los Olivos', kind:'Heces en vía pública', lat:-11.9906, lng:-77.0731, status:'open', created_at:'2026-11-20T09:15:00Z' },
  { id:'AV-103', title:'Mal olor persistente en la esquina', location:'Av. Universitaria con Jr. Las Gardenias', district:'Comas', kind:'Orina / mal olor', lat:-11.9440, lng:-77.0580, status:'in_progress', created_at:'2026-11-19T16:30:00Z' },
  { id:'AV-102', title:'Área verde con residuos de mascotas', location:'Parque El Olivar · zona de juegos', district:'Independencia', kind:'Heces en vía pública', lat:-11.9941, lng:-77.0492, status:'open', created_at:'2026-11-18T13:10:00Z' },
  { id:'AV-101', title:'Vereda atendida por cuadrilla municipal', location:'Av. Perú cdra. 34 · frente al mercado', district:'San Martín de Porres', kind:'Heces en vía pública', lat:-12.0173, lng:-77.0837, status:'resolved', created_at:'2026-11-17T10:00:00Z' },
  { id:'AV-100', title:'Punto crítico reportado por vecinos', location:'Pasaje Las Palmeras · altura del colegio', district:'Los Olivos', kind:'Otro problema de salubridad', lat:-11.9737, lng:-77.0742, status:'in_progress', created_at:'2026-11-15T08:20:00Z' }
];
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const appState = { reports: [], filter: 'all', district: 'all', mainMap: null, miniMap: null, supabase: null, user: null, staffMode: false };
const localKey = 'alertavecinal-reports-v1';

function dateLabel(value) { return new Intl.DateTimeFormat('es-PE',{day:'2-digit',month:'short'}).format(new Date(value)).replace('.',''); }
function statusClass(status) { return status === 'resolved' ? 'status-resolved' : status === 'in_progress' ? 'status-progress' : 'status-open'; }
function statusMarkup(status) { return `<span class="status-pill ${statusClass(status)}"><i></i>${STATUS_LABELS[status] || 'Abierto'}</span>`; }
function escapeHtml(value='') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function reportRow(r) { const statusCell=appState.staffMode?`<select class="inline-status" aria-label="Cambiar estado de ${escapeHtml(r.title)}" data-report-id="${escapeHtml(r.id)}"><option value="open" ${r.status==='open'?'selected':''}>Abierto</option><option value="in_progress" ${r.status==='in_progress'?'selected':''}>En seguimiento</option><option value="resolved" ${r.status==='resolved'?'selected':''}>Atendido</option></select>`:statusMarkup(r.status);return `<tr><td><div class="report-title"><span class="report-pin ${statusClass(r.status)}">⌖</span><div><b>${escapeHtml(r.title)}</b><small>${escapeHtml(r.location)}</small></div></div></td><td>${escapeHtml(r.district)}</td><td><span class="kind-label">${escapeHtml(r.kind)}</span></td><td>${statusCell}</td><td class="date-cell">${dateLabel(r.created_at)}</td></tr>`; }

async function connectBackend() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    appState.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    appState.supabase.auth.onAuthStateChange((_event, session) => { appState.user=session?.user||null; void refreshStaffAccess(); });
    const {data:authData}=await appState.supabase.auth.getSession();appState.user=authData?.session?.user||null;await refreshStaffAccess();
    const { data, error } = await appState.supabase.from('reports').select('*').order('created_at',{ascending:false}).limit(100);
    if (!error && data?.length) return data;
    if (error) console.warn('Supabase indisponible; se muestra el modo local.', error.message);
  } catch (e) { console.warn('No fue posible inicializar Supabase.', e); }
  return null;
}
async function loadReports() {
  const remote = await connectBackend();
  if (remote) { appState.reports = remote; return; }
  try { appState.reports = [...seed, ...JSON.parse(localStorage.getItem(localKey) || '[]')]; }
  catch { appState.reports = [...seed]; }
}
function renderTables() {
  const recent = [...appState.reports].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  $('#recent-rows').innerHTML = recent.map(reportRow).join('');
  const shown = filterReports(appState.reports,{query:$('#report-search')?.value || '',status:$('#report-status-filter')?.value || 'all'});
  $('#all-rows').innerHTML = shown.map(reportRow).join('');
  $('#empty-state').classList.toggle('hidden', shown.length > 0);
  $('#nav-count').textContent = appState.reports.length;
  $('#map-total').textContent = appState.reports.length;
  document.querySelectorAll('[data-report-id]').forEach(el=>el.addEventListener('change',()=>changeStatus(el.dataset.reportId,el.value)));
}
function renderStats() {
  const s=reportStats(appState.reports); $('#metric-open').textContent=s.open; $('#metric-done').textContent=s.done; $('#metric-neighbors').textContent=s.neighbors;
  const counts=DISTRICTS.map(d=>({name:d,count:appState.reports.filter(r=>r.district===d).length})); const max=Math.max(1,...counts.map(x=>x.count));
  $('#district-bars').innerHTML=counts.map(x=>`<div class="district-row"><div class="district-label"><span>${escapeHtml(x.name)}</span><b>${x.count}</b></div><div class="bar-track"><i style="width:${Math.max(7,Math.round(x.count/max*100))}%"></i></div></div>`).join('');
}
function initMap(el, zoom, center=[-11.985,-77.067]) {
  if (!window.L || !el || el._leaflet_id) return null;
  const map=L.map(el,{zoomControl:true,scrollWheelZoom:false}).setView(center,zoom);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; OpenStreetMap contributors',maxZoom:19}).addTo(map); return map;
}
function drawPins(map, reports=appState.reports) {
  if (!map) return;
  map.eachLayer(layer=>{if(layer instanceof L.Marker) map.removeLayer(layer);});
  const selected=filterReports(reports,{status:appState.filter,district:appState.district});
  selected.forEach(r=>{const klass=statusClass(r.status);const icon=L.divIcon({className:'',html:`<div class="custom-pin ${klass}"><span>⌖</span></div>`,iconSize:[34,40],iconAnchor:[17,35]});L.marker([r.lat,r.lng],{icon}).addTo(map).bindPopup(`<b>${escapeHtml(r.title)}</b><br>${escapeHtml(r.district)} · ${escapeHtml(STATUS_LABELS[r.status]||'Abierto')}`);});
}
function mapsRefresh() { drawPins(appState.miniMap);drawPins(appState.mainMap); }
function initPlan() {
  const sprints=[['Sprint 1','23 nov – 4 dic','Base segura y diseño','21 pts'],['Sprint 2','7 – 18 dic','Reportar y ubicar','26 pts'],['Sprint 3','21 dic – 1 ene','Seguimiento municipal','24 pts'],['Sprint 4','4 – 15 ene','Indicadores y entrega','23 pts']];
  $('#sprint-strip').innerHTML=sprints.map((s,i)=>`<article class="sprint-card ${i===3?'sprint-current':''}"><div class="sprint-num">0${i+1}</div><div><small>${s[1]}</small><b>${s[0]}</b><span>${s[2]}</span></div><strong>${s[3]}</strong></article>`).join('');
  const lanes=[['To Do',4,['AV-13 Validar ubicación','AV-17 Accesibilidad','AV-20 Exportar datos']],['In Progress',3,['AV-11 Registrar incidencia','AV-14 Mapa de puntos']],['In Review',2,['AV-18 Controles RLS','AV-19 Pruebas del flujo']],['Done',5,['AV-01 Diseño del sistema','AV-04 Ver reportes','AV-08 Filtrar por zona']]];
  $('#kanban-board').innerHTML=lanes.map(l=>`<div class="kanban-lane"><div class="lane-head"><span>${l[0]}</span><b>${l[1]}</b></div><div class="wip">WIP ≤ ${l[0]==='In Progress'?3:l[0]==='In Review'?2:'—'}</div>${l[2].map((x,i)=>`<div class="kanban-card"><small>${i%2?'Backend':'Producto'} · ${i+2} pts</small><b>${x}</b><span class="kanban-person">${['AV','LN','CM'][i]}</span></div>`).join('')}</div>`).join('');
  const rows=[['Épica 1 · Reportar','Reporte vecinal',0,35],['Épica 2 · Ubicar','Mapa colaborativo',12,54],['Épica 3 · Atender','Gestión municipal',35,77],['Épica 4 · Medir','Indicadores',60,100]];
  $('#gantt-chart').innerHTML=`<div class="gantt-months"><span>23 NOV</span><span>7 DIC</span><span>21 DIC</span><span>4 ENE</span><span>15 ENE</span></div>`+rows.map((r,i)=>`<div class="gantt-row"><div>${r[0]}<small>${r[1]}</small></div><div class="gantt-track"><i class="gantt-bar bar-${i+1}" style="left:${r[2]}%;width:${r[3]-r[2]}%">${i===0?'S1 · S2':i===1?'S1 · S3':i===2?'S2 · S4':'S3 · S4'}</i></div></div>`).join('');
  const canvas=$('#burndown');const ctx=canvas.getContext('2d');const w=canvas.width=canvas.clientWidth*devicePixelRatio;const h=canvas.height=210*devicePixelRatio;ctx.scale(devicePixelRatio,devicePixelRatio);const W=canvas.clientWidth,H=210;ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='#e8eeeb';ctx.lineWidth=1;for(let i=0;i<5;i++){const y=18+i*39;ctx.beginPath();ctx.moveTo(32,y);ctx.lineTo(W-8,y);ctx.stroke();ctx.fillStyle='#84918c';ctx.font='11px DM Sans';ctx.fillText(String(23-i*5),4,y+4);}
  const pts=(values,color,dash=[])=>{ctx.beginPath();ctx.setLineDash(dash);ctx.strokeStyle=color;ctx.lineWidth=2.5;values.forEach((v,i)=>{const x=38+i*(W-55)/(values.length-1),y=18+(23-v)/23*156;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.setLineDash([])};
  pts([23,19,15,11,7,3,0],'#9daaa4',[5,5]);pts([23,21,18,14,12,7,0],'#b6cf49');
}
function openView(name) {
  const key=name==='plan'?'Plan del proyecto':name==='mapa'?'Mapa de reportes':name==='reportes'?'Reportes':'Resumen';
  $$('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${name}`));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#crumb-title').textContent=key;
  if(name==='mapa'){setTimeout(()=>{if(!appState.mainMap)appState.mainMap=initMap($('#full-map'),12);else appState.mainMap.invalidateSize();mapsRefresh();},80)}
}
function toast(message){const t=$('#toast');t.textContent=message;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3200)}
function saveLocal(report){const items=JSON.parse(localStorage.getItem(localKey)||'[]');items.unshift({...report,local_author:'vecino'});localStorage.setItem(localKey,JSON.stringify(items));}
async function refreshStaffAccess(){
  if(!appState.supabase||!appState.user){appState.staffMode=false;updateAuthButton();return;}
  const {data,error}=await appState.supabase.from('municipal_staff').select('user_id').eq('user_id',appState.user.id).maybeSingle();
  appState.staffMode=!error&&Boolean(data);updateAuthButton();renderTables();
}
function updateAuthButton(){const b=$('#auth-btn');if(!b)return;b.textContent=appState.staffMode?'Salir de gestión ↗':appState.user?'Cuenta verificada · salir':'Acceso municipal ↗';b.classList.toggle('authorized',appState.staffMode);}
async function changeStatus(id,status){
  if(!appState.staffMode||!appState.supabase){toast('Necesitas una cuenta municipal autorizada.');renderTables();return;}
  const {error}=await appState.supabase.from('reports').update({status,updated_at:new Date().toISOString()}).eq('id',id);
  if(error){toast('No se pudo cambiar el estado. Verifica el permiso municipal.');renderTables();return;}
  await loadReports();renderStats();renderTables();mapsRefresh();toast('Estado del reporte actualizado.');
}
async function handleAuth(){
  if(!appState.supabase){toast('El acceso municipal se activa al conectar Supabase.');return;}
  if(appState.user){await appState.supabase.auth.signOut();appState.staffMode=false;await refreshStaffAccess();renderTables();toast('Sesión cerrada.');return;}
  $('#auth-message').textContent='';$('#auth-message').classList.remove('error');$('#auth-modal').classList.remove('hidden');
}
async function sendAuthLink(event){event.preventDefault();const email=new FormData(event.currentTarget).get('email');const {error}=await appState.supabase.auth.signInWithOtp({email,options:{emailRedirectTo:window.location.origin}});$('#auth-message').textContent=error?'No se pudo enviar el acceso. Revisa el correo ingresado.':'Si el correo está habilitado, recibirás un enlace para ingresar.';if(error)$('#auth-message').classList.add('error');}
async function submitReport(event){event.preventDefault();const form=new FormData(event.currentTarget);const values=Object.fromEntries(form.entries());try{const report=normalizeReport({...values,anonymous:form.has('anonymous')});if(appState.supabase){const {error}=await appState.supabase.from('reports').insert({title:report.title,location:report.location,district:report.district,kind:report.kind,lat:report.lat,lng:report.lng,status:'open',anonymous:report.anonymous});if(error)throw new Error('No se pudo guardar el reporte. Revisa la conexión y las políticas de Supabase.');}else saveLocal(report);await loadReports();renderStats();renderTables();mapsRefresh();$('#report-modal').classList.add('hidden');event.currentTarget.reset();$('#toast').textContent='Reporte recibido. Gracias por cuidar el barrio.';toast('Reporte recibido. Gracias por cuidar el barrio.');}catch(e){$('#form-message').textContent=e.message;$('#form-message').classList.add('error');}}
function showModal(){ $('#form-message').textContent='';$('#form-message').classList.remove('error');$('#report-modal').classList.remove('hidden');$('#report-form').querySelector('input').focus(); }
function initialize(){
  $('#today').textContent=new Intl.DateTimeFormat('es-PE',{weekday:'short',day:'2-digit',month:'short'}).format(new Date()).replace('.','');
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.view)));$$('[data-view]').filter(e=>!e.classList.contains('nav-item')).forEach(b=>b.addEventListener('click',()=>openView(b.dataset.view)));
  $$('[data-open-report]').forEach(b=>b.addEventListener('click',showModal));$('#close-modal').addEventListener('click',()=>$('#report-modal').classList.add('hidden'));$('#report-modal').addEventListener('click',e=>{if(e.target.id==='report-modal')e.currentTarget.classList.add('hidden')});$('#report-form').addEventListener('submit',submitReport);
  $('#report-search').addEventListener('input',renderTables);$('#report-status-filter').addEventListener('change',renderTables);$('#district-filter').addEventListener('change',e=>{appState.district=e.target.value;mapsRefresh()});$$('.chip').forEach(b=>b.addEventListener('click',()=>{$$('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');appState.filter=b.dataset.filter;mapsRefresh()}));
  $('#locate-btn').addEventListener('click',()=>{if(!navigator.geolocation){toast('Tu navegador no permite obtener ubicación.');return;}navigator.geolocation.getCurrentPosition(({coords})=>{const f=$('#report-form');f.elements.lat.value=coords.latitude.toFixed(6);f.elements.lng.value=coords.longitude.toFixed(6);toast('Ubicación agregada al reporte.');},()=>toast('No se pudo obtener la ubicación. Revisa los permisos.'),{enableHighAccuracy:true,timeout:8000});});
  $('#help-btn').addEventListener('click',()=>toast('Usa “Crear reporte” para compartir un punto crítico.'));window.addEventListener('resize',()=>{if(appState.mainMap)appState.mainMap.invalidateSize();});
  $('#auth-btn').addEventListener('click',handleAuth);$('#close-auth').addEventListener('click',()=>$('#auth-modal').classList.add('hidden'));$('#auth-modal').addEventListener('click',e=>{if(e.target.id==='auth-modal')e.currentTarget.classList.add('hidden')});$('#auth-form').addEventListener('submit',sendAuthLink);
  loadReports().then(()=>{renderStats();renderTables();appState.miniMap=initMap($('#mini-map'),12);mapsRefresh();initPlan();});
}
initialize();
