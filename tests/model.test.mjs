import test from 'node:test';import assert from 'node:assert/strict';import {checkedIds,percent,storageKey} from '../public/model.mjs';
const steps=[{id:1},{id:2},{id:3}];
test('Recupera únicamente pasos de la ruta',()=>assert.deepEqual(checkedIds('[2,4,2]',steps),[2]));
test('Tolera almacenamiento dañado',()=>assert.deepEqual(checkedIds('!',steps),[]));
test('Ignora estructura inválida',()=>assert.deepEqual(checkedIds('{}',steps),[]));
test('Calcula un paso de tres',()=>assert.equal(percent(1,3),33));
test('Reconoce la ruta completa',()=>assert.equal(percent(3,3),100));
test('Maneja catálogo vacío',()=>assert.equal(percent(0,0),0));
test('Separa las dos modalidades',()=>assert.notEqual(storageKey('Galería'),storageKey('Ambulante')));
