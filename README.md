# Alerta Vecinal · PC2

Aplicación web comunitaria para registrar y ubicar puntos críticos de salubridad relacionados con residuos de mascotas en Los Olivos, Comas, San Martín de Porres e Independencia.

## Ejecutar en local

Requiere Node.js 20 o superior. Para registrar reportes o iniciar sesión se requiere conexión con el proyecto Supabase configurado.

```bash
npm ci
npm test
npm run build
npm run dev
```

Para servir sin herramienta de desarrollo, abre `index.html` con un servidor estático local. `npm run build` genera `dist/`.

## Supabase configurado

El proyecto `pc2-miasaavedra` ya está conectado en `src/config.js`. La migración `supabase/migrations/202611200001_create_reports.sql` se ejecutó en SQL Editor y creó las tablas `reports` y `municipal_staff`, índices y políticas RLS. Auth utiliza el dominio de producción de Vercel. La migración `202611210001_private_contacts_admin.sql` agrega los datos privados de contacto, acceso administrativo por correo verificado y el envío atómico del reporte.

La clave publishable del navegador no es una clave secreta; la protección depende de RLS. No subas nunca una clave `service_role` ni una contraseña de base de datos. Las cuentas vecinales se crean desde el modal de acceso y requieren verificar el correo. La administradora se reconoce solo cuando `mia.saavedra@usil.pe` está verificado. Para habilitar personal municipal adicional, agrega su UUID a `public.municipal_staff` desde el panel seguro. Los datos de contacto del reportante se guardan en `reporter_contacts`; solo la administración y personal autorizado pueden leerlos. No se guardan en la tabla pública `reports`.

## Despliegue Vercel

Importa el repositorio como un proyecto estático, con directorio de salida `dist`. Para despliegues mediante GitHub Actions, configura `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID` como secretos del repositorio. Los pushes a `test` crean previsualizaciones; `main` publica producción después de pasar calidad y seguridad. Para Google, habilita el proveedor Google en Supabase Authentication → Sign In / Providers y configura ahí las credenciales OAuth de Google, usando la URL de callback que indica Supabase.

## Seguridad y privacidad

- RLS habilitado para los reportes y membresía municipal.
- El formulario solicita nombre y teléfono para seguimiento; los guarda en una tabla privada y no los publica en el mapa ni en el listado.
- Coordenadas restringidas al ámbito geográfico del caso.
- Validación de campos tanto en el navegador como en las restricciones de Postgres.
- Cabeceras HTTP básicas, análisis estático CodeQL, escaneo de secretos Gitleaks y revisión de dependencias en Pull Requests.
- Los cambios de estado requieren la cuenta administradora verificada o un usuario autenticado inscrito en `municipal_staff`.
- El plan del proyecto solo aparece en la sesión de la cuenta administradora verificada.

## Estructura

- `index.html`, `src/`: aplicación responsive y experiencia vecinal.
- `src/domain.js`: reglas de validación, filtros y métricas.
- `supabase/migrations/`: esquema y políticas RLS.
- `.github/workflows/ci.yml`: pruebas, controles de seguridad y publicación.
- `informe/INFORME_PC2.md`: desarrollo de las cuatro preguntas, backlog, diagramas y cronograma.
