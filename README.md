# Gamarra Gemelo Digital
Simulador municipal de seis zonas ilustrativas del emporio de Gamarra. No usa un modelo calibrado con mediciones de campo.
## Cinco épicas
1. Modelado de zonas y puestos. El planificador edita puestos, vacantes, flujo y capacidad por hora.
2. Simulador. El traslado efectivo es el mínimo de solicitud, oferta de origen y vacantes en destino.
3. Indicadores. Se calculan presión peatonal, afluencia y ventas brutas diarias antes y después por zona.
4. Comparación. Se guardan parámetros y línea base de cada alternativa, con comparación de dos escenarios.
5. Informes. CSV y vista de impresión/PDF incluyen parámetros y resultados.
## Cuenta
Registro e ingreso local con PBKDF2/SHA-256 y AES-GCM. El navegador conserva únicamente la bóveda cifrada. La contraseña desbloquea la clave en memoria; recargar o salir cierra la sesión. Los cambios de dos pestañas se controlan por revisión. La copia cifrada permite trasladarse a un perfil nuevo conservando la contraseña. Sin contraseña no existe recuperación. No hay autenticación institucional ni sincronización entre usuarios.
## Verificación
Ejecutar node build.mjs, node --test y node security.mjs. GitHub Actions verifica el PR y Vercel publica main.
