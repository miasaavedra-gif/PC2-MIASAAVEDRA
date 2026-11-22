import {spaces,requestLink} from './market.mjs';
import {transition,addTurn} from './turnos.mjs';
const key='trama.gamarra.turnos.v1';
const el=id=>document.getElementById(id);
const read=()=>JSON.parse(localStorage.getItem(key)||'[]');
const make=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n};
function draw(){let rows;try{rows=read()}catch{el('turns').textContent='El navegador no permite recuperar las solicitudes.';return}
 el('turns').replaceChildren();el('deskrows').replaceChildren();
 if(!rows.length)el('turns').append(make('p','Todavía no has solicitado un turno. Elige un espacio para comenzar.'));
 const pending=rows.filter(r=>r.state==='Pendiente');el('pending').textContent=pending.length+' pendientes de revisión';
 for(const r of rows.slice().reverse()){const s=spaces.find(x=>x.id===r.space);if(!s)continue;
 const card=make('article','');card.append(make('h3',s.name),make('p',r.date+' · '+s.hours+' · S/ '+s.price),make('strong',r.state+' · '+r.id));
 const controls=make('div','');controls.className='actions';if(r.state==='Pendiente'){controls.append(action('Cancelar solicitud',r.id,'Cancelada'))}
 const a=make('a','Preparar expediente público ↗');a.href=requestLink(s,r.date);a.target='_blank';a.rel='noopener noreferrer';controls.append(a);card.append(controls);el('turns').append(card);
 if(r.state==='Pendiente'){const item=make('article','');item.append(make('h3',s.name),make('p',r.date+' · '+s.hours+' · '+r.id));const buttons=make('div','');buttons.className='actions';buttons.append(action('Aceptar turno',r.id,'Aceptada'),action('Rechazar',r.id,'Rechazada'));item.append(buttons);el('deskrows').append(item)}
 }}
async function change(fn){try{const update=()=>{localStorage.setItem(key,JSON.stringify(fn(read())))};if(navigator.locks)await navigator.locks.request(key,update);else update();draw();return true}catch(e){el('feedback').textContent=e.message;el('feedback').scrollIntoView();return false}}
function action(title,id,state){const b=make('button',title);b.type='button';b.onclick=async()=>{if(await change(rows=>transition(rows,id,state)))el('feedback').textContent=id+' · '+state};return b}
export async function submitTurn(s,date){const id='TG-'+crypto.randomUUID().slice(0,8).toUpperCase();if(await change(rows=>addTurn(rows,{id,space:s.id,date,state:'Pendiente'}))){el('feedback').textContent='Solicitud '+id+' registrada. Puedes evaluarla en la mesa de galería del piloto.';el('seguimiento').scrollIntoView()}}
window.addEventListener('storage',e=>{if(e.key===key)draw()});draw();
