# Resumen

Ojo Camba es una plataforma de reportes ciudadanos para la gestión de la infraestructura urbana de Santa Cruz
de la Sierra. Un ciudadano registra un problema con una fotografía y su ubicación GPS; el sistema lo indexa en
celdas hexagonales H3, el equipo de Backoffice lo valida y lo agrupa en un Caso de Obra, las cuadrillas
municipales lo atienden en campo y la coordinación sigue la carga de trabajo con un panel que compara lo
observado con un pronóstico. Este informe describe el proyecto completo: el problema que aborda, la
metodología Scrum con la que se desarrolló, los requisitos expresados en quince casos de uso y veintisiete
historias de usuario, la arquitectura de microservicios, el modelo de datos, la implementación de cada
módulo, las pruebas y el despliegue. El sistema reúne siete servicios de backend en NestJS y Python, cuatro
aplicaciones web progresivas en React, una base de datos PostgreSQL con PostGIS y h3-pg de veintitrés tablas,
y un almacenamiento de imágenes compatible con S3. Su calidad se verifica con 264 pruebas unitarias en Jest,
34 pruebas en pytest y 43 pruebas de extremo a extremo en Playwright, que se ejecutan en integración continua
y en un control previo a cada commit. El resultado es un sistema que cubre el ciclo completo reportar,
moderar, resolver y medir, con decisiones auditables en cada etapa.

**Palabras clave:** reportes ciudadanos, infraestructura urbana, microservicios, índice espacial H3, Scrum.
