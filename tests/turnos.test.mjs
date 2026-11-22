import test from 'node:test';import assert from 'node:assert/strict';import {transition,addTurn} from '../public/turnos.mjs';
const r={id:'A',space:'AT-01',date:'2026-12-03',state:'Pendiente'};
test('La galería acepta una solicitud pendiente',()=>assert.equal(transition([r],'A','Aceptada')[0].state,'Aceptada'));
test('Una decisión es definitiva',()=>assert.throws(()=>transition([{...r,state:'Aceptada'}],'A','Rechazada')));
test('Impide duplicados activos',()=>assert.throws(()=>addTurn([r],{...r,id:'B'})));
test('Cancelar libera el turno',()=>assert.equal(addTurn(transition([r],'A','Cancelada'),{...r,id:'B'}).length,2));
test('Evita doble aceptación de la misma fecha y módulo',()=>assert.throws(()=>transition([r,{...r,id:'B',state:'Aceptada'}],'A','Aceptada')));
