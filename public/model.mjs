export function checkedIds(raw,steps){let saved;try{saved=JSON.parse(raw)}catch{return []}return steps.filter(s=>Array.isArray(saved)&&saved.includes(s.id)).map(s=>s.id)}
export function percent(done,total){return total?Math.round(100*done/total):0}
export function storageKey(kind){return 'ruta-gamarra/v1/'+kind}
