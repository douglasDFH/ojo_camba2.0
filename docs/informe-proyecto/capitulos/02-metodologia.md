# Metodología {#metodologia}

## Marco de trabajo Scrum

El proyecto se desarrolló con Scrum (Schwaber & Sutherland, 2020). El equipo de cuatro integrantes asignó
los roles por consenso, según el perfil y la disponibilidad de cada uno (@tabla:roles). No existe un rol de
QA dedicado: la responsabilidad de las pruebas se reparte entre los desarrolladores, y cada pull request
requiere la aprobación de al menos un compañero antes de fusionarse.

Tabla: Roles del equipo Scrum {#roles anchos=3.2,4.3,8.5}

| Rol | Integrante | Responsabilidades principales |
|-----|------------|-------------------------------|
| Product Owner | {{PRODUCT_OWNER}} | Dueño del Product Backlog: redacta y prioriza las historias, valida los criterios de aceptación y mueve un ítem a terminado solo tras verificar la Definition of Done |
| Scrum Master | {{SCRUM_MASTER}} | Facilita los eventos Scrum, elimina impedimentos y mantiene actualizados el tablero de GitHub Projects y el gráfico de avance |
| Developers | {{DESARROLLADORES}} | Se autoorganizan para cumplir el objetivo del sprint, implementan los microservicios y las aplicaciones, escriben pruebas y revisan el código de sus compañeros |

## Product Backlog y estimación

El Product Backlog inicial reunió veintitrés historias de usuario. Las quince primeras se derivaron de los
quince casos de uso del portafolio UML; las ocho restantes se identificaron inspeccionando el código fuente.
Las historias se estimaron con Planning Poker en escala de Fibonacci (Cohn, 2005), en dos sesiones; cuando la
diferencia entre el voto más alto y el más bajo superaba dos posiciones de la escala, se repetía la votación
tras escuchar a los extremos.

Después, el Product Owner clasificó las historias con el método MoSCoW. El criterio fue si la historia forma
parte del flujo central del sistema —reportar, moderar, resolver y medir— (@tabla:moscow).

Tabla: Priorización MoSCoW del Product Backlog inicial {#moscow anchos=2.6,8.4,2.5}

| Categoría | Historias de usuario | Puntos |
|-----------|----------------------|-------:|
| Must Have | HU-01, HU-02, HU-06, HU-07, HU-08, HU-09, HU-14, HU-18 | 34 |
| Should Have | HU-03, HU-04, HU-10, HU-12, HU-16, HU-17, HU-19, HU-20, HU-21, HU-22 | 27 |
| Could Have | HU-05, HU-11, HU-13, HU-15, HU-23 | 12 |
| Won't Have | Gamificación completa con stickers, integración con WhatsApp Business y modelo predictivo de zonas críticas | — |

Nota: Dos de los temas que en ese momento quedaron como Won't Have se implementaron en iteraciones
posteriores: la gamificación por puntos y niveles, y el modelo de predicción de demanda (@sec:implementacion).

## Definition of Done

El equipo definió seis criterios que toda historia debe cumplir para considerarse terminada, cada uno con su
evidencia verificable (@tabla:dod). Los criterios se configuraron como lista de verificación en cada ítem de
GitHub Projects.

Tabla: Definition of Done del equipo {#dod anchos=8.5,7.5}

| Criterio | Evidencia |
|----------|-----------|
| Código versionado en GitHub y fusionado a la rama principal mediante un pull request aprobado | Enlace al pull request en el ítem del tablero |
| Pruebas unitarias escritas y aprobadas para toda la lógica nueva | Pipeline de integración continua en verde |
| Código revisado y aprobado por al menos un compañero | Comentario de aprobación en el pull request |
| Funcionalidad demostrada en vivo al Product Owner | Casilla marcada por el Product Owner en la Sprint Review |
| Sin errores de linter y con build de producción exitoso | Pipeline de GitHub Actions en verde |
| Documentación mínima actualizada | Enlace a la sección de documentación modificada |

## Ejecución de los sprints

El objetivo del Sprint 1 fue que un ciudadano pudiera registrar un reporte con foto y ubicación GPS y verlo
georreferenciado en el mapa de calor; se comprometieron 26 puntos de historia. Los sprints 2 y 3 cerraron el
ciclo operativo —módulos del técnico en campo, administración de usuarios y dispositivos, y el tablero de
indicadores— y cumplieron todo lo comprometido (@tabla:sprints).

Tabla: Cumplimiento de los sprints 2 y 3 {#sprints anchos=3,4.5,4.5,3.5}

| Sprint | Puntos comprometidos | Puntos completados | Cumplimiento |
|--------|---------------------:|-------------------:|-------------:|
| Sprint 2 | 27 | 27 | 100 % |
| Sprint 3 | 7 | 7 | 100 % |

Nota: El Sprint 3 se ejecutó en cuatro días, en paralelo con el cierre del Sprint 2, por el cronograma
institucional.

Tras los tres sprints, el trabajo continuó organizado por issues de GitHub. Esas iteraciones incorporaron la
operación municipal con cuadrillas y visitas, la matriz de permisos por rol, los asistentes de inteligencia
artificial, el panel de decisión con pronóstico de demanda y el refuerzo de la integridad de la base de datos.

## Herramientas y prácticas de calidad

El código vive en un monorepo con pnpm. Cada cambio pasa por un control automático previo al commit
(Husky) que formatea, revisa el estilo, ejecuta las pruebas y compila los diez paquetes. Las mismas etapas se
repiten en GitHub Actions para cada pull request hacia la rama principal. Las métricas DORA
(Forsgren et al., 2018) se adoptaron como referencia para evaluar la madurez del ciclo de entrega.
