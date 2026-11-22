import {checkedIds,percent,storageKey} from './model.mjs';
const el=id=>document.getElementById(id);
let catalog=[];
let completed=[];
let temporary={};
function save(){const key=storageKey(el('puesto').value);temporary[key]=JSON.stringify(completed);try{localStorage.setItem(key,temporary[key])}catch{el('estado').textContent+=' · Solo disponible en esta sesión.'}}
function render(){
 const kind=el('puesto').value, steps=catalog.filter(s=>s.puesto===kind), key=storageKey(kind);
 let raw=temporary[key];try{raw??=localStorage.getItem(key)}catch{}
 completed=checkedIds(raw,steps); el('titulo').textContent='Ruta de '+kind.toLowerCase();el('pasos').replaceChildren();
 const update=()=>{const p=percent(completed.length,steps.length);el('avance').value=p;el('estado').textContent=completed.length+' de '+steps.length+' pasos completados · '+p+' %'};
 for(const step of steps){const li=document.createElement('li'),label=document.createElement('label'),box=document.createElement('input'),note=document.createElement('p');box.type='checkbox';box.checked=completed.includes(step.id);box.onchange=()=>{completed=box.checked?[...completed,step.id]:completed.filter(id=>id!==step.id);update();save()};label.append(box,step.paso);note.textContent=step.detalle;li.append(label,note);el('pasos').append(li)}
 update();el('reset').hidden=false;
}
async function load(){el('retry').hidden=true;el('estado').textContent='Cargando los pasos…';try{const res=await fetch('https://xddkouxlkrbagqidtssf.supabase.co/rest/v1/rutas?select=id,puesto,paso,detalle&order=id',{headers:{apikey:'sb_publishable_iUSFm8WDAyz_cqhYFs3i4w_Z6wSdSlq'}});if(!res.ok)throw Error();catalog=await res.json();if(!catalog.length)throw Error();render()}catch{el('estado').textContent='No se pudo cargar el catálogo. Comprueba tu conexión.';el('retry').hidden=false}}
el('puesto').onchange=()=>{if(catalog.length)render()};el('retry').onclick=load;el('reset').onclick=()=>{if(confirm('¿Reiniciar los pasos de esta ruta?')){completed=[];save();render()}};load();
