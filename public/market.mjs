export const spaces = [
 {id:'AT-01',name:'Patio Algodón',zone:'Gamarra norte',use:'Ropa',shift:'Mañana',hours:'08:00–13:00',price:18,area:4,amenity:'Perchero y probador',tone:'algodon'},
 {id:'AT-02',name:'Pasaje Índigo',zone:'Gamarra centro',use:'Denim',shift:'Tarde',hours:'14:00–19:00',price:24,area:6,amenity:'Mesa de exhibición',tone:'indigo'},
 {id:'AT-03',name:'Taller Canela',zone:'Gamarra sur',use:'Accesorios',shift:'Mañana',hours:'08:00–13:00',price:12,area:3,amenity:'Vitrina compartida',tone:'canela'},
 {id:'AT-04',name:'Galería Trama',zone:'Gamarra centro',use:'Ropa',shift:'Tarde',hours:'14:00–19:00',price:22,area:5,amenity:'Probador y espejo',tone:'trama'},
 {id:'AT-05',name:'Patio Añil',zone:'Gamarra norte',use:'Denim',shift:'Mañana',hours:'08:00–13:00',price:20,area:5,amenity:'Perchero reforzado',tone:'anil'},
 {id:'AT-06',name:'Corredor Coral',zone:'Gamarra sur',use:'Accesorios',shift:'Tarde',hours:'14:00–19:00',price:15,area:3,amenity:'Mesa y vitrina',tone:'coral'}
];
export function matchSpaces({use='',shift='',budget=Infinity},catalog=spaces){
 return catalog.filter(s=>(!use||s.use===use)&&(!shift||s.shift===shift)&&s.price<=budget).sort((a,b)=>a.price-b.price);
}
export function breakEven(price,sale,cost){
 if(![price,sale,cost].every(Number.isFinite)||price<=0||cost<0||sale<=cost)return null;
 return Math.ceil(price/(sale-cost));
}
export const repo='https://github.com/miasaavedra-gif/PC2-MIASAAVEDRA';
export function requestLink(space,date){
 const title='[Turno demo] '+space.id+' · '+date;
 const body=['Solicitud de evaluación de un turno de demostración.', 'Espacio: '+space.name,'Modalidad: '+space.use,'Horario: '+space.hours,'Fecha: '+date,'Tarifa referencial: S/ '+space.price,'El envío solicita evaluación. La disponibilidad y la autorización requieren confirmación.'].join('\n');
 return repo+'/issues/new?'+new URLSearchParams({title,body});
}
export function ticketStatus(issue){
 if(issue.pull_request || !/^\[Turno demo\] AT-0[1-6] · \d{4}-\d{2}-\d{2}$/.test(issue.title))throw Error('El número no corresponde a un turno de este piloto.');
 const labels=issue.labels.map(l=>l.name);
 if(labels.includes('turno-confirmado'))return 'Confirmado por coordinación';
 if(labels.includes('turno-rechazado'))return 'Solicitud rechazada';
 return issue.state==='closed'?'Solicitud cerrada':'Recibida · pendiente de evaluación';
}
export function limaDay(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Lima',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
}
