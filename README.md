# Alerta Vecinal · PC2

Aplicación web para registrar y ubicar puntos críticos de salubridad en Los Olivos, Comas, San Martín de Porres e Independencia.

## Desarrollo local

`npm ci` · `npm test` · `npm run check` · `npm run build`

La solución usa HTML/CSS/JavaScript, Leaflet/OpenStreetMap, Supabase (Auth + PostgreSQL con RLS) y un despliegue estático en Vercel. Los reportes de muestra son ficticios y locales; la migración inicia sin datos inventados.

Configura Supabase en `src/config.js` con URL y clave publicable. Nunca pongas una service-role key en el frontend. La migración está en `supabase/migrations/`.

El informe académico detallado se entrega por separado en el paquete ZIP; no está incluido en este repositorio público.
