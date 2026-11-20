export const DISTRICTS = ['Los Olivos', 'Comas', 'San Martín de Porres', 'Independencia'];
export const STATUS_LABELS = { open: 'Abierto', in_progress: 'En seguimiento', resolved: 'Atendido' };
export function normalizeReport(input, id = `R-${Date.now()}`) {
  const lat = Number(input.lat), lng = Number(input.lng);
  if (!input.title?.trim() || !input.location?.trim() || !DISTRICTS.includes(input.district)) throw new Error('Completa la descripción, distrito y referencia.');
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -12.2 || lat > -11.7 || lng < -77.3 || lng > -76.8) throw new Error('La ubicación debe estar dentro de Lima Norte.');
  return { id, title: input.title.trim(), location: input.location.trim(), district: input.district, kind: input.kind || 'Otro problema de salubridad', lat, lng, status: 'open', created_at: new Date().toISOString(), anonymous: input.anonymous !== false };
}
export function reportStats(reports) {
  return { open: reports.filter(r => r.status !== 'resolved').length, done: reports.filter(r => r.status === 'resolved').length, neighbors: new Set(reports.map(r => r.reporter_id || r.local_author || r.id)).size, total: reports.length };
}
export function filterReports(reports, { query = '', status = 'all', district = 'all' } = {}) {
  const q = query.trim().toLocaleLowerCase('es');
  return reports.filter(r => (status === 'all' || r.status === status) && (district === 'all' || r.district === district) && (!q || `${r.title} ${r.location} ${r.district} ${r.kind}`.toLocaleLowerCase('es').includes(q)));
}
