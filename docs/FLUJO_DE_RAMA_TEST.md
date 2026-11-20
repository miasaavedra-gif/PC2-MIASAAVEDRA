# Flujo de ramas de la PC2

- `main`: versión aprobada para producción.
- `test`: integración y despliegue de previsualización.
- `feature/HU-XX-resumen`: rama corta por historia, PR hacia `test`.
- Después de los checks, se abre un PR `test` → `main`.

Los checks configurados ejecutan pruebas, build, CodeQL, Gitleaks y revisión de dependencias.
