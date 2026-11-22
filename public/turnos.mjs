export function transition(rows,id,next){
 const row=rows.find(r=>r.id===id);
 if(!row||row.state!=='Pendiente'||!['Aceptada','Rechazada','Cancelada'].includes(next))throw Error('La solicitud ya fue atendida.');
 if(next==='Aceptada'&&rows.some(r=>r.space===row.space&&r.date===row.date&&r.state==='Aceptada'))throw Error('Este espacio ya tiene un turno aceptado para esa fecha.');
 return rows.map(r=>r.id===id?{...r,state:next}:r);
}
export function addTurn(rows,turn){
 if(rows.some(r=>r.space===turn.space&&r.date===turn.date&&['Pendiente','Aceptada'].includes(r.state)))throw Error('Ya existe una solicitud activa para ese espacio y fecha.');
 return [...rows,turn];
}
