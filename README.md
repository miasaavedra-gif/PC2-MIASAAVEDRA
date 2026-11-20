# Alerta Vecinal · PC2

Aplicación web para registrar y ubicar puntos críticos de salubridad en Los Olivos, Comas, San Martín de Porres e Independencia.

## Desarrollo local

`npm ci` · `npm test` · `npm run check` · `npm run build`

La solución usa HTML/CSS/JavaScript, Leaflet/OpenStreetMap, Supabase Auth + PostgreSQL con RLS, GitHub Actions y Vercel. Los reportes de muestra son ficticios y locales; la base inicia sin registros inventados.

## Supabase

El proyecto `pc2-miasaavedra` está configurado con la migración de `supabase/migrations/`. El cliente del navegador usa la URL y la clave publicable en `src/config.js`; RLS permite leer reportes anónimos, insertar reportes abiertos dentro de los distritos y coordenadas permitidos, y reserva cambios de estado a usuarios registrados en `municipal_staff`.

Nunca publiques una clave `service_role` ni un secreto en el frontend. Para habilitar una cuenta de personal municipal, crea el usuario en Auth y registra su UUID en `public.municipal_staff` desde el panel seguro. La URL de retorno de Auth está configurada para el sitio de Vercel.

## Calidad y entrega

GitHub Actions ejecuta cinco pruebas, revisión de sintaxis, build, CodeQL, Gitleaks y auditoría de dependencias en Pull Requests. El informe académico detallado se entrega por separado y no se incluye en este repositorio público.
