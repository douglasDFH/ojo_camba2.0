# Resumen

Ojo Camba es una plataforma de reportes ciudadanos sobre la infraestructura urbana de Santa Cruz de la
Sierra, construida con microservicios NestJS, aplicaciones web progresivas en React y una base de datos
PostgreSQL con PostGIS. Su Product Backlog reúne veintitrés historias de usuario (HU-01 a HU-23), derivadas
de los casos de uso del portafolio UML y de una primera inspección del código. Este informe documenta cuatro
historias nuevas, HU-24 a HU-27, que describen funcionalidad ya implementada en el sistema pero que no tenía
historia escrita: la sugerencia explicable de gravedad de un reporte, la recomendación de la cuadrilla más
adecuada para un Caso de Obra, el registro del resultado de una visita de campo con confirmación de la
autoridad y la decisión justificada sobre las alertas del pronóstico de demanda. Las historias se
identificaron analizando los servicios `ms-ia`, `ms-admin` y `ms-prediccion`, y sus criterios de aceptación
se tomaron de las reglas que el propio código hace cumplir. Cada historia se presenta como una ficha con su
actor, módulo, caso de uso relacionado, criterios de aceptación y escenarios en Gherkin, junto con una tabla
de trazabilidad hacia el código fuente. El resultado completa el backlog con los módulos de inteligencia
artificial, operación de campo y predicción, y deja los criterios listos para verificarse con pruebas
automatizadas.

**Palabras clave:** historias de usuario, Product Backlog, criterios de aceptación, Gherkin, reportes
ciudadanos.
