# Introducción {#intro}

## Contexto y planteamiento del problema

Santa Cruz de la Sierra genera un volumen alto de denuncias ciudadanas sobre baches, luminarias apagadas,
acumulación de residuos y alcantarillas obstruidas. Esas denuncias circulan dispersas en redes sociales y
mensajería, sin una ubicación precisa, sin un criterio de prioridad y sin una forma de seguir su resolución.
Para la administración municipal, el resultado es información difícil de convertir en decisiones; para el
ciudadano, la falta de respuesta visible desalienta volver a reportar.

Ojo Camba sistematiza esas denuncias. Cada reporte se georreferencia con el índice espacial jerárquico H3
(Brodsky, 2018), lo que permite agrupar problemas cercanos, dibujar mapas de calor y medir la carga por zona.
Sobre esos datos el sistema funciona como un sistema de soporte a la decisión (Power, 2002): organiza el
trabajo de las cuadrillas, deja trazabilidad pública de cada caso y estima la demanda de las semanas
siguientes.

## Objetivos

### Objetivo general

Desarrollar una plataforma de reportes ciudadanos georreferenciados que cubra el ciclo completo de un
problema urbano —reportar, moderar, resolver y medir— con trazabilidad pública y soporte a la decisión para
la gestión municipal de Santa Cruz de la Sierra.

### Objetivos específicos

1. Permitir que cualquier ciudadano, con o sin cuenta, registre un reporte con fotografía y ubicación GPS
   desde su teléfono.
2. Dar al equipo de Backoffice las herramientas para validar los reportes y agruparlos en Casos de Obra.
3. Organizar la atención en campo mediante cuadrillas, visitas planificadas y una bitácora pública del caso.
4. Ofrecer a la coordinación y a la autoridad municipal indicadores, alertas de capacidad y un pronóstico de
   demanda, con decisiones registradas y auditables.
5. Garantizar la calidad del sistema con pruebas automatizadas, integración continua y un monitoreo público
   de la disponibilidad de los servicios.

## Alcance

El informe cubre el sistema tal como está en el repositorio del proyecto: siete servicios de backend, cuatro
aplicaciones web, la base de datos con sus once migraciones y las pruebas automatizadas. Incluye la
metodología de trabajo, los requisitos, la arquitectura, el modelo de datos, la implementación por módulo, las
pruebas y el despliegue. Quedan fuera la validación de campo con funcionarios municipales —la guía de
entrevista está diseñada pero su aplicación se pospuso fuera del ciclo académico— y las integraciones con
plataformas externas como WhatsApp. Los datos históricos con los que se entrenó el modelo de predicción son
sintéticos, generados por un simulador con reglas conocidas; solo el clima proviene de una fuente real.

El documento sigue el formato de la séptima edición del manual de publicaciones APA
(American Psychological Association, 2020).
