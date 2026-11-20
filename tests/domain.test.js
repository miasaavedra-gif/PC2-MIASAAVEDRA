import test from 'node:test';
import assert from 'node:assert/strict';
import { filterReports, normalizeReport, reportStats } from '../src/domain.js';

const base={title:'Heces en parque',location:'Parque Central',district:'Los Olivos',kind:'Heces en via publica',lat:-11.99,lng:-77.06};
test('normalizes reports and applies safe defaults',()=>{const r=normalizeReport(base,'R-1');assert.equal(r.id,'R-1');assert.equal(r.status,'open');assert.equal(r.anonymous,true);assert.equal(r.district,'Los Olivos');});
test('rejects locations outside Lima Norte',()=>{assert.throws(()=>normalizeReport({...base,lat:-10.5}),/Lima Norte/);});
test('requires minimum fields and a known district',()=>{assert.throws(()=>normalizeReport({...base,title:'  '}),/Completa/);assert.throws(()=>normalizeReport({...base,district:'Miraflores'}),/distrito/);});
test('counts open, resolved, and participating reports',()=>{const reports=[{id:'a',status:'open'},{id:'b',status:'in_progress'},{id:'c',status:'resolved'}];assert.deepEqual(reportStats(reports),{open:2,done:1,neighbors:3,total:3});});
test('filters by text, status, and district without mutating input',()=>{const reports=[{title:'Parque limpio',location:'Av Peru',district:'Comas',kind:'Heces',status:'open'},{title:'Esquina',location:'Parque Central',district:'Los Olivos',kind:'Olor',status:'resolved'}];assert.equal(filterReports(reports,{query:'parque',district:'Los Olivos'}).length,1);assert.equal(filterReports(reports,{status:'open'}).length,1);assert.equal(reports.length,2);});
