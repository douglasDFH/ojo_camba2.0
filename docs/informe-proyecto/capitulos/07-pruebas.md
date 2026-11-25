# Pruebas y aseguramiento de calidad {#pruebas}

## Estrategia

La calidad se verifica en tres niveles. Las pruebas unitarias comprueban la lógica de negocio de cada
servicio con repositorios simulados: Jest en los servicios NestJS y pytest en el servicio de predicción. Las
pruebas de extremo a extremo, con Playwright, recorren las aplicaciones reales en un navegador contra el
backend completo y una base de datos real. A eso se suman comprobaciones estáticas: formato con Prettier,
estilo con ESLint y compilación de TypeScript.

Las pruebas unitarias, el estilo y la compilación corren en dos momentos: en el control previo a cada commit,
que impide guardar un cambio que no pasa, y en GitHub Actions para cada pull request hacia la rama principal.

## Resultados

Los resultados corresponden a la ejecución del 24 de noviembre de 2026 sobre el estado actual del
repositorio (@tabla:pruebas-unitarias y @tabla:pruebas-e2e).

Tabla: Pruebas unitarias por servicio {#pruebas-unitarias anchos=4,3,3,3}

| Servicio | Herramienta | Pruebas | Resultado |
|----------|-------------|--------:|-----------|
| gateway-principal | Jest | 46 | Aprobadas |
| gateway-status | Jest | 9 | Aprobadas |
| ms-auth | Jest | 18 | Aprobadas |
| ms-register | Jest | 30 | Aprobadas |
| ms-admin | Jest | 120 | Aprobadas |
| ms-gamify | Jest | 12 | Aprobadas |
| ms-ia | Jest | 29 | Aprobadas |
| ms-prediccion | pytest | 34 | Aprobadas |
| **Total** | | **298** | |

Tabla: Pruebas de extremo a extremo por área {#pruebas-e2e anchos=5.2,8,2.3}

| Archivo | Qué comprueba | Pruebas |
|---------|---------------|--------:|
| acceso-por-rol | Cada rol entra a su área, ve solo su menú y no abre rutas ajenas | 10 |
| backoffice-responsive | La bandeja y la navegación funcionan a 375, 390 y 428 píxeles | 8 |
| panel-decision | Separación entre observado y estimado, permisos, filtros y uso en móvil | 16 |
| reporte-y-aceptar | Reporte anónimo, aceptación, agrupación y fusión en un caso existente | 4 |
| moderacion-realtime | Llegada en tiempo real y bloqueo entre dos moderadores | 2 |
| backoffice-calidad | Aceptación en el caso activo, descarte con motivo y bandejas | 1 |
| backoffice-coordenadas | Coordenadas históricas en la bitácora del caso | 1 |
| tecnico-bitacora | Distribución de una visita y llegada con GPS del técnico | 1 |
| **Total** | | **43** |

Nota: En una base de datos nueva, sin historia, dos pruebas del panel de decisión no pueden comprobar nada:
una necesita zonas con pronóstico y la otra se omite sola cuando no hay alertas. Con los datos históricos de
desarrollo, las 43 pruebas se aprobaron.

## Hallazgos de la última revisión

La revisión completa del proyecto encontró y corrigió tres problemas. Primero, las entidades no declaraban
las llaves foráneas ni los índices que creó la última migración, de modo que generar una migración nueva
habría propuesto borrarlos; se declararon con sus nombres reales y la comprobación de desfase quedó limpia.
Segundo, con una base sin historia, el servicio de predicción respondía con un error interno al pedir las
alertas, y el panel de decisión ocultaba también los datos observados; ahora responde con un estado esperado
y el panel muestra lo observado igual. Tercero, cuatro pruebas de extremo a extremo estaban desactualizadas
respecto de la interfaz o calculaban la fecha en UTC en lugar de la hora de Bolivia.

Quedan dos mejoras pendientes para la integración continua: ejecutar las pruebas de `ms-prediccion` y la
comprobación de desfase entre entidades y base de datos, que hoy se corren a mano.
