import {submitTurn} from './desk.mjs';
import {spaces,matchSpaces,breakEven,requestLink,ticketStatus,limaDay,repo} from './market.mjs';
const el=id=>document.getElementById(id);
const make=(tag,value,cls)=>{const node=document.createElement(tag);if(value!=null)node.textContent=value;if(cls)node.className=cls;return node};
const button=(title,fn,cls)=>{const b=make('button',title,cls);b.type='button';b.onclick=fn;return b};
let selected;const compare=new Set();
function draw(){
 const f=new FormData(el('filters'));const items=matchSpaces({use:f.get('use'),shift:f.get('shift'),budget:f.get('budget')===''?Infinity:Number(f.get('budget'))});
 el('results').textContent=items.length?items.length+' espacios · ordenados por menor tarifa':'No hay coincidencias. Prueba otro turno o amplía el presupuesto.';
 el('cards').replaceChildren();
 for(const s of items){const card=make('article',null,'card');const inner=make('div',null,'inside');
 inner.append(make('p',s.zone+' / '+s.use,'tag'),make('h3',s.name),make('p',s.hours+' · '+s.area+' m²'),make('p',s.amenity),make('p','S/ '+s.price+' por turno','price'));
 const controls=make('div',null,'actions');const toggle=button(compare.has(s.id)?'Quitar':'Comparar',()=>{if(compare.has(s.id))compare.delete(s.id);else compare.add(s.id);draw()},'light');toggle.disabled=compare.size>=3&&!compare.has(s.id);toggle.setAttribute('aria-pressed',String(compare.has(s.id)));
 controls.append(button('Evaluar turno',()=>detail(s)),toggle);inner.append(controls);card.append(make('div',null,'swatch '+s.tone),inner);el('cards').append(card)}
 const chosen=spaces.filter(s=>compare.has(s.id));el('compare').hidden=!chosen.length;
 const t=make('table');for(const [title,key] of [['Espacio','name'],['Precio por turno (S/)','price'],['Horario','hours'],['Área (m²)','area'],['Equipamiento','amenity']]){const row=t.insertRow();row.append(make('th',title));for(const s of chosen)row.append(make('td',s[key]))}
 const row=t.insertRow();row.append(make('th','Acción'));for(const s of chosen){const td=make('td');td.append(button('Elegir '+s.name,()=>detail(s)),button('Quitar',()=>{compare.delete(s.id);draw()},'light'));row.append(td)}el('comparison').replaceChildren(t);
}
function estimate(){if(!selected)return;const units=breakEven(selected.price,el('sale').valueAsNumber,el('cost').valueAsNumber);el('units').textContent=units===null?'Ingresa un precio mayor que el costo y valores válidos.':units+' unidad'+(units===1?'':'es')+' para cubrir S/ '+selected.price;}
function detail(s){selected=s;el('spacename').textContent=s.name;el('terms').textContent=s.zone+' · '+s.hours+' · S/ '+s.price+' por turno · '+s.amenity;el('details').hidden=false;el('day').min=limaDay();el('day').value||=limaDay();estimate();el('details').scrollIntoView()}
el('filters').oninput=draw;el('filters').onreset=()=>setTimeout(draw,0);el('sale').oninput=estimate;el('cost').oninput=estimate;
el('request').onsubmit=e=>{e.preventDefault();const day=el('day');day.min=limaDay();if(day.reportValidity())submitTurn(selected,day.value)};
let serial=0;el('lookup').onsubmit=async e=>{e.preventDefault();const seq=++serial,number=el('number').value;el('ticket').textContent='Consultando el expediente…';try{const res=await fetch('https://api.github.com/repos/miasaavedra-gif/PC2-MIASAAVEDRA/issues/'+encodeURIComponent(number));if(!res.ok)throw Error(res.status===404?'No se encontró ese expediente.':'No se pudo consultar. Intenta nuevamente.');const issue=await res.json();const status=ticketStatus(issue);if(seq!==serial)return;const a=make('a','Abrir expediente ↗');a.href=repo+'/issues/'+encodeURIComponent(number);el('ticket').replaceChildren(make('strong',status),document.createTextNode(' · '+issue.title+' · '),a)}catch(err){if(seq===serial)el('ticket').textContent=err.message}};draw();
