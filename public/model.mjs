export const initial = [
 {id:'ga',name:'Jr. Gamarra',kind:'Calle',stalls:420,places:500,flow:2400,capacity:1800},
 {id:'hu',name:'Jr. Huánuco',kind:'Calle',stalls:310,places:420,flow:1750,capacity:1600},
 {id:'it',name:'Jr. Italia',kind:'Calle',stalls:180,places:300,flow:1200,capacity:1350},
 {id:'a',name:'Galería A',kind:'Galería',stalls:80,places:240,flow:540,capacity:1000},
 {id:'b',name:'Galería B',kind:'Galería',stalls:120,places:360,flow:780,capacity:1300},
 {id:'c',name:'Galería C',kind:'Galería',stalls:65,places:150,flow:410,capacity:700}
];
export function integer(value,min,max){return Number.isSafeInteger(value)&&value>=min&&value<=max}
export function validZone(z){
 return z&&initial.some(x=>x.id===z.id&&x.kind===z.kind)&&typeof z.name==='string'&&z.name.trim().length>0&&z.name.length<=60&&integer(z.places,1,100000)&&integer(z.stalls,0,z.places)&&integer(z.flow,0,1000000)&&integer(z.capacity,1,1000000);
}
export const defaults={origin:'ga',destination:'a',requested:200,follow:65,conversion:12,ticket:35,hours:8};
export function simulate(zones,p){
 if(zones.length!==6||!zones.every(validZone)||new Set(zones.map(z=>z.id)).size!==6)throw Error('Revisa los datos de las seis zonas.');
 const a=zones.find(z=>z.id===p.origin&&z.kind==='Calle'),b=zones.find(z=>z.id===p.destination&&z.kind==='Galería');
 if(!a||!b||!integer(p.requested,0,100000)||!integer(p.follow,0,100)||!integer(p.conversion,0,100)||!Number.isFinite(p.ticket)||p.ticket<=0||p.ticket>10000||!integer(p.hours,1,24))throw Error('Revisa la cantidad y los supuestos.');
 const moved=Math.min(p.requested,a.stalls,b.places-b.stalls);
 const displaced=a.stalls?Math.round(a.flow*moved/a.stalls):0;
 const captured=Math.round(displaced*p.follow/100);
 const rows=zones.map(z=>{
  const source=z===a,dest=z===b;
  const flow=z.flow+(source?-displaced:dest?captured:0),stalls=z.stalls+(source?-moved:dest?moved:0);
  const sales=f=>Math.round(f*p.hours*p.conversion/100*p.ticket);
  return {...z,afterStalls:stalls,afterFlow:flow,index:100*z.flow/z.capacity,afterIndex:100*flow/z.capacity,sales:sales(z.flow),afterSales:sales(flow)};
 });
 return {moved,pending:p.requested-moved,displaced,captured,lost:displaced-captured,rows,delta:rows.reduce((s,r)=>s+r.afterSales-r.sales,0),peak:Math.max(...rows.map(z=>z.afterIndex))};
}
export function csv(rows){return '\uFEFF'+rows.map(row=>row.map(value=>{let v=String(value);if(typeof value==='string'&&/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replaceAll('"','""')+'"'}).join(';')).join('\r\n')}
