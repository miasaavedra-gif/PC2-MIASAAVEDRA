import {readdir,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
for(const page of ['index.html','guia.html','market.css','style.css'])await access('public/'+page);
for(const name of await readdir('public'))if(name.endsWith('.mjs'))execFileSync(process.execPath,['--check','public/'+name]);
console.log('Validación de la bolsa de turnos y de la guía completada.');