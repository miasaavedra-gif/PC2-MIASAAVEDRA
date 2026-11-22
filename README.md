# Trama Gamarra · bolsa de turnos textiles

## Caso y propuesta
Un puesto permanente exige un compromiso de alquiler que un comerciante ambulante puede no estar listo para asumir. El piloto explora el uso por jornadas de módulos de galería y permite probar si las ventas cubren el alquiler. Las seis ofertas y sus tarifas son ficticias. La aceptación en el piloto no constituye licencia, contrato ni reserva comercial.

## Historias y planificación reformulada
| Sprint | Épica y objetivo | Historias y criterios de aceptación | SP y prioridad |
|---|---|---|---|
| 1 | Descubrir oferta compatible con el negocio | Como comerciante quiero filtrar por rubro, horario y presupuesto para ver turnos viables. Dado Ropa, mañana y S/18, cuando filtro, entonces veo Patio Algodón. Como comerciante quiero comparar opciones para evaluar costo, área y horario. Dadas dos seleccionadas, cuando abro la comparación, entonces veo ambas en columnas. | 3 Must + 3 Should |
| 2 | Evaluar la viabilidad por jornada | Como vendedor quiero calcular mis ventas mínimas para evaluar el alquiler. Dado S/22 de alquiler y S/12 de margen, cuando calculo, entonces necesito dos ventas. Como vendedor quiero detectar un margen insuficiente para revisar mis costos. Dado margen cero, cuando calculo, entonces aparece una indicación y se omite el resultado. | 3 Must + 2 Must |
| 3 | Solicitar y seguir turnos | Como comerciante quiero solicitar una fecha para iniciar una evaluación. Dado un turno libre, cuando envío, entonces se genera un código y estado pendiente. Como comerciante quiero cancelar para liberar una fecha. Dada una solicitud pendiente, cuando cancelo, entonces puedo solicitar ese turno otra vez. | 5 Must + 2 Should |
| 4 | Coordinar oferta y demanda | Como galería quiero aceptar o rechazar solicitudes para gestionar mi turno. Dada una pendiente, cuando decido, entonces el comerciante ve el estado después de recargar. Como comerciante quiero compartir un expediente para consultar su evaluación desde otro equipo. Dado un número válido, cuando consulto el expediente público, entonces veo su estado de GitHub. | 5 Must + 3 Could |

Esta tabla actualiza la planificación de producto. El Jira histórico PC2 corresponde a la primera versión. La evidencia de la reformulación está en el PR de esta versión.

## Arquitectura y operación
Vercel sirve el frontend estático. market.mjs filtra y calcula, turnos.mjs valida las transiciones, desk.mjs persiste el ejercicio de dos roles en localStorage por navegador y serializa los cambios con Web Locks donde están disponibles. La función opcional de expediente abre GitHub Issues y consulta su API pública. Un coordinador del repositorio puede usar las etiquetas turno-confirmado o turno-rechazado. El expediente público y la simulación local se gestionan independientemente. La guía complementaria en /guia.html consulta Supabase por HTTPS con su clave publicable y política RLS de lectura. En dispositivos compartidos se recomienda usar datos ficticios.

## DevSecOps
Plan: historias y criterios. Code: rama test y PR. Build: comprobación de módulos. Test: node --test. Release: integración del PR tras CI. Deploy: Vercel publica main y repite las validaciones. Operate: revisión de solicitudes y errores de consulta. Monitor: registros de Actions y despliegue. El sitio usa CSP, inserción segura de texto y análisis estático. El navegador no contiene credenciales privilegiadas.

## Ejecutar
Desde la raíz: node build.mjs, node --test y node security.mjs. Servir public/ por HTTP.
