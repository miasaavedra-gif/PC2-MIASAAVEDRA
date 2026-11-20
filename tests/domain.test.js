import test from 'node:test';
import assert from 'node:assert/strict';
import { filterReports, normalizeReport, reportStats } from '../src/domain.js';

const base={title:'Heces en parque',location:'Parque Central',district:'Los Olivos',kind:'Heces en v�a p�blica',lat:-11.99,lng:-77.06};
test('normaliza reportes y aplica valores iniciales seguros',()=>{const r=normalizeReport(base,'R-1');assert.equal(r.id,'R-1');assert.equal(r.status,'open');assert.equal(r.anonymous,true);assert.equal(r.district,'Los Olivos');});
test('rechaza ubicaci�n fuera del �mbito de Lima Norte',()=>{assert.throws(()=>normalizeReport({...base,lat:-10.5}),/Lima Norte/);});
test('requiere campos m�nimos y un distrito conocido',()=>{assert.throws(()=>normalizeReport({...base,title:'  '}),/descripci�n/);assert.throws(()=>normalizeReport({...base,district:'Miraflores'}),/distrito/);});
test('calcula casos abiertos, atendidos y participantes',()=>{const reports=[{id:'a',status:'open'},{id:'b',status:'in_progress'},{id:'c',status:'resolved'}];assert.deepEqual(reportStats(reports),{open:2,done:1,neighbors:3,total:3});});
test('filtra por texto, estado y distrito sin modificar el origen',()=>{const reports=[{title:'Parque limpio',location:'Av. Per�',district:'Comas',kind:'Heces',status:'open'},{title:'Esquina',location:'Parque Central',district:'Los Olivos',kind:'Olor',status:'resolved'}];assert.equal(filterReports(reports,{query:'parque',district:'Los Olivos'}).length,1);assert.equal(filterReports(reports,{status:'open'}).length,1);assert.equal(reports.length,2);});

