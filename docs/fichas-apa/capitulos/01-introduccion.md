# Introducción {#intro}

## Contexto y antecedentes

Ojo Camba es una plataforma de reportes ciudadanos sobre la infraestructura urbana de Santa Cruz de la
Sierra, Bolivia. Un ciudadano registra un problema con una fotografía y su ubicación GPS; el equipo de
Backoffice lo valida y lo agrupa en un Caso de Obra; las cuadrillas municipales lo atienden en campo, y la
coordinación sigue la carga de trabajo con un panel de decisión que compara lo observado con un pronóstico.

El sistema está organizado como un monorepo con dos gateways HTTP y microservicios NestJS que se comunican
por TCP, un microservicio de predicción en Python, cuatro aplicaciones web progresivas en React y una base de
datos PostgreSQL con las extensiones PostGIS y h3-pg para indexar los reportes en celdas hexagonales.

El Product Backlog del proyecto contiene veintitrés historias de usuario (HU-01 a HU-23). Las quince
primeras se derivaron de los casos de uso del portafolio UML y las ocho restantes de una primera inspección
del código fuente. Desde entonces el sistema incorporó módulos de inteligencia artificial, de operación de
campo y de predicción de demanda que no tienen historia de usuario en ese backlog.

## Objetivos

El objetivo general es documentar, como historias de usuario con criterios de aceptación verificables, la
funcionalidad implementada en Ojo Camba que no está cubierta por las historias HU-01 a HU-23.

Los objetivos específicos son:

1. Identificar en el código fuente las funcionalidades sin historia de usuario.
2. Redactar una ficha por historia, con su actor, módulo, caso de uso relacionado y criterios de aceptación
   tomados de las reglas que el código hace cumplir.
3. Expresar cada historia en escenarios Gherkin que puedan automatizarse como pruebas.
4. Relacionar cada historia con el archivo de código que la implementa.

## Alcance

El informe cubre cuatro historias, HU-24 a HU-27, que continúan la numeración del Product Backlog. Comprende
el triaje asistido de gravedad, la recomendación de cuadrillas, el resultado de la visita de campo y las
decisiones sobre el pronóstico. No modifica las historias HU-01 a HU-23 ni define la planificación de los
sprints. La prioridad y la estimación de cada ficha son una propuesta que el equipo debe confirmar en su
sesión de Planning Poker. El documento sigue el formato de la séptima edición del manual de publicaciones
APA (American Psychological Association, 2020).
