# Requisitos {#requisitos}

## Actores y roles

El sistema distingue seis roles globales. Todo usuario registrado conserva el rol de ciudadano; los demás se
agregan y pueden revocarse sin impedirle reportar. Ser responsable de una cuadrilla no es un rol global sino
una asignación dentro de la cuadrilla. La autorización se comprueba en el gateway, que responde 401 o 403, y
las acciones de campo usan siempre el usuario autenticado, nunca un identificador enviado por el navegador.
La @tabla:permisos resume qué puede hacer cada rol.

Tabla: Matriz de permisos por rol {#permisos anchos=3.4,2,2,2.3,2.3,2,2 tam=9}

| Acción | Ciudadano | Backoffice | Técnico asignado | Coordinador operativo | Encargado IT | Autoridad |
|--------|-----------|------------|------------------|-----------------------|--------------|-----------|
| Reportar y consultar lo público | Sí | Sí | Sí | Sí | Sí | Sí |
| Aceptar o rechazar en la bandeja | No | Sí | No | No | No | No |
| Ver y actualizar los casos asignados | No | No | Sí | Sí | No | No |
| Confirmar una derivación en campo | No | No | Responsable de su cuadrilla | Sí (audita) | No | No |
| Priorizar o reasignar cuadrillas | No | No | No | Sí | No | No |
| Gestionar usuarios, roles y umbrales | No | No | No | No | Sí | No |
| Consultar el tablero estratégico | No | No | No | Sí | Sí | Sí |

## Casos de uso

Los requisitos funcionales se modelaron en quince casos de uso agrupados por actor (@tabla:casos-uso),
documentados con diagramas UML 2.5 (Object Management Group, 2017).

Tabla: Casos de uso del sistema {#casos-uso anchos=1.6,3.4,11}

| CU | Actor | Descripción |
|----|-------|-------------|
| CU-01 | Ciudadano | Visualizar el mapa de calor de problemas urbanos en tiempo real |
| CU-02 | Ciudadano | Registrar un reporte con fotografía, categoría y ubicación GPS |
| CU-03 | Ciudadano | Crear una cuenta y enlazar sus reportes previos mediante el identificador del dispositivo |
| CU-04 | Ciudadano | Consultar la bitácora pública de su reporte con los avances de las cuadrillas |
| CU-05 | Ciudadano | Compartir el estado de su reporte en redes sociales |
| CU-06 | Moderador | Visualizar la bandeja de reportes en estado inicial |
| CU-07 | Moderador | Validar un reporte y aceptarlo o rechazarlo; al aceptarlo se crea o se reutiliza un Caso de Obra |
| CU-08 | Moderador | Fusionar reportes de una misma zona en un Caso de Obra existente |
| CU-09 | Moderador | Bloquear de forma permanente un dispositivo que genera spam |
| CU-10 | Técnico | Visualizar los reportes y Casos de Obra cercanos a su ubicación |
| CU-11 | Técnico | Agrupar en terreno reportes duplicados en un Caso de Obra |
| CU-12 | Técnico | Registrar avances en la bitácora de obra sin cambiar el estado del caso |
| CU-13 | Técnico | Corregir las coordenadas GPS del problema al llegar al lugar |
| CU-14 | Técnico | Cambiar el estado general del Caso de Obra |
| CU-15 | Público | Visualizar la disponibilidad y la latencia de cada microservicio |

## Historias de usuario

El Product Backlog inicial tiene veintitrés historias (@tabla:historias). Cada una se redactó con la
plantilla «Como… quiero… para…» y un criterio de aceptación clave; la estimación es el consenso del Planning
Poker.

Tabla: Product Backlog inicial, historias HU-01 a HU-23 {#historias anchos=1.7,9.3,3,2 tam=10}

| HU | Historia (resumen) | Actor | Puntos |
|----|--------------------|-------|-------:|
| HU-01 | Visualizar el mapa de calor H3 en tiempo real | Ciudadano | 5 |
| HU-02 | Registrar un reporte con foto, GPS e índices H3 | Ciudadano | 5 |
| HU-03 | Crear una cuenta vinculada al dispositivo | Ciudadano | 3 |
| HU-04 | Consultar la bitácora pública del reporte | Ciudadano | 3 |
| HU-05 | Compartir un reporte en redes sociales | Ciudadano | 2 |
| HU-06 | Ver la bandeja de reportes pendientes | Moderador | 3 |
| HU-07 | Aceptar o rechazar un reporte | Moderador | 3 |
| HU-08 | Agrupar reportes duplicados en un Caso de Obra | Moderador | 8 |
| HU-09 | Bloquear el dispositivo de un generador de spam | Moderador | 2 |
| HU-10 | Ver los Casos de Obra cercanos a la ubicación GPS | Técnico | 5 |
| HU-11 | Agrupar reportes en terreno | Técnico | 5 |
| HU-12 | Registrar avances diarios en la bitácora de obra | Técnico | 5 |
| HU-13 | Corregir las coordenadas GPS de un reporte | Técnico | 2 |
| HU-14 | Cerrar un Caso de Obra como finalizado | Técnico | 3 |
| HU-15 | Consultar el estado de los microservicios | Auditor | 2 |
| HU-16 | Cerrar la sesión de forma segura | Usuario | 1 |
| HU-17 | Consultar el perfil y las estadísticas de participación | Usuario | 2 |
| HU-18 | Ver un tablero con las métricas clave | Moderador / Admin | 3 |
| HU-19 | Gestionar los usuarios registrados y sus roles | Administrador | 3 |
| HU-20 | Vincular el dispositivo a la cuenta al iniciar sesión | Usuario | 2 |
| HU-21 | Consultar el listado de mis reportes | Usuario | 2 |
| HU-22 | Renovar la sesión automáticamente durante 30 días | Usuario | 2 |
| HU-23 | Consultar el historial de dispositivos bloqueados | Moderador / Admin | 2 |

## Historias de usuario incorporadas: HU-24 a HU-27

Las iteraciones posteriores agregaron módulos de inteligencia artificial, operación de campo y predicción que
no tenían historia de usuario. Se documentaron cuatro historias nuevas, que continúan la numeración del
backlog (@tabla:historias-nuevas). Sus criterios de aceptación se tomaron de las validaciones que el código
aplica; las fichas completas están en el Anexo A y sus escenarios Gherkin en el Anexo B.

Tabla: Historias de usuario HU-24 a HU-27 {#historias-nuevas anchos=1.7,7.3,4,3}

| HU | Historia | Actor | Módulo |
|----|----------|-------|--------|
| HU-24 | Sugerencia explicable de la gravedad de un reporte | Moderador / Coordinador | `ms-ia` |
| HU-25 | Recomendación de la cuadrilla más adecuada para un Caso de Obra | Coordinador | `ms-ia`, `ms-admin` |
| HU-26 | Resultado de la visita de campo con confirmación de la autoridad | Técnico, responsable de cuadrilla | `ms-admin` |
| HU-27 | Decisión registrada sobre una alerta de capacidad del pronóstico | Coordinador, autoridad municipal | `ms-admin`, `ms-prediccion` |

Nota: La prioridad y la estimación de HU-24 a HU-27 son una propuesta que el equipo debe confirmar en
Planning Poker [[verificar: confirmar prioridad y puntos con el equipo]].

## Requisitos no funcionales

- **Atomicidad.** Aceptar un reporte usa un bloqueo pesimista de fila, de modo que dos moderadores no puedan
  aceptar el mismo reporte a la vez.
- **Trazabilidad.** El Caso de Obra avanza por una máquina de estados con transiciones definidas, en lugar de
  borrarse; cada cambio queda en su bitácora.
- **Integridad referencial.** Diecinueve llaves foráneas con reglas explícitas de borrado protegen la
  coherencia entre reportes, casos, visitas y usuarios.
- **Privacidad y seguridad.** Contraseñas con hash, sesiones con tokens de acceso y de renovación, y claves de
  los proveedores de inteligencia artificial cifradas en la base de datos.
- **Uso móvil.** Las aplicaciones se diseñan primero para pantallas de 375 a 428 píxeles y funcionan como
  aplicaciones web progresivas.
- **Disponibilidad visible.** Un gateway independiente consulta cada minuto el estado de los
  microservicios y lo publica sin autenticación.
