# Casos de Uso del Sistema Ojo Camba

**Alcance:** requisitos funcionales consolidados a partir del backlog, la matriz de permisos,
la arquitectura, las aplicaciones y los endpoints actuales. El diagrama editable está en
[`casos_de_uso.drawio`](casos_de_uso.drawio).

Un usuario puede tener varios roles simultáneamente. El **responsable de cuadrilla** no es un
rol global: es un técnico asignado como responsable dentro de una cuadrilla.

## Ciudadanía

* **CU-01:** Visualizar el mapa de calor de problemas urbanos.
* **CU-02:** Registrar un reporte con fotografía, categoría, GPS y DeviceID.
* **CU-03:** Crear una cuenta y vincular el historial de reportes anónimos mediante DeviceID.
* **CU-04:** Consultar la bitácora pública de un reporte o del Caso de Obra al que pertenece.
* **CU-05:** Compartir el estado de un reporte o Caso de Obra mediante enlace o sticker.
* **CU-16:** Iniciar y cerrar sesión y renovar la sesión autenticada.
* **CU-17:** Consultar el perfil y los reportes propios.
* **CU-18:** Consultar puntos, nivel y progreso de gamificación.

## Moderación comunitaria / Backoffice

* **CU-06:** Revisar la bandeja de reportes pendientes.
* **CU-07:** Validar, aceptar o rechazar un reporte; al aceptarlo, crear o asignar un Caso de Obra
  y confirmar o corregir su categoría.
* **CU-08:** Agrupar reportes adicionales en un Caso de Obra existente.
* **CU-09:** Bloquear o desbloquear el DeviceID de un dispositivo.
* **CU-30:** Consultar alertas, historial y métricas de calidad de la revisión.
* **CU-31:** Consultar el asistente de IA para apoyo en el Backoffice.
* **CU-32:** Solicitar apoyo de IA para triaje, sugerencias de hechos y recomendación de cuadrilla.

## Técnico en campo

* **CU-10:** Consultar reportes y Casos de Obra cercanos a su ubicación.
* **CU-11:** Crear en campo un Caso de Obra agrupando reportes duplicados cercanos.
* **CU-12:** Registrar una actualización con comentario, foto, recursos solicitados y fecha estimada,
  sin exigir un cambio de estado.
* **CU-13:** Corregir las coordenadas GPS del problema desde el lugar.
* **CU-14:** Actualizar el estado del Caso de Obra conforme a las transiciones permitidas.
* **CU-23:** Consultar obras asignadas, visitas y ruta diaria.
* **CU-24:** Registrar la llegada a una visita con coordenadas GPS.
* **CU-25:** Proponer el resultado de una visita, adjuntar evidencia e indicar derivación o rechazo
  cuando corresponda.
* **CU-27:** Registrar la derivación de un Caso de Obra a una entidad externa, con motivo y evidencia.

> **Brecha de implementación en CU-11:** el requisito está documentado en HU-04, pero el endpoint
> actual de creación de grupos (`POST /admin/groups`) está protegido para Backoffice. El gateway no
> expone actualmente esa acción al técnico. El diagrama marca CU-11 como requisito pendiente de
> habilitación para ese actor; no lo presenta como una función ya disponible.

## Responsable de cuadrilla

* **CU-22:** Planificar visitas y asignarlas a técnicos, ordenando la ruta de la cuadrilla.
* **CU-26:** Confirmar propuestas de resultado de la cuadrilla; las excepciones pueden ser revisadas
  por el coordinador operativo.

## Coordinador operativo

* **CU-21:** Asignar o reasignar una cuadrilla a un Caso de Obra y priorizar la operación.
* **CU-28:** Consultar indicadores operativos, carga y capacidad de las cuadrillas.
* **CU-35:** Consultar alertas de capacidad para decidir dónde intervenir.
* **CU-36:** Comparar casos observados y estimados por zona y categoría, sin confundir ambas fuentes.
* **CU-37:** Aceptar, modificar o descartar una recomendación, registrando el motivo.
* **CU-38:** Consultar el historial de decisiones y su precisión retrospectiva.

## Encargado de TI

* **CU-19:** Administrar cuadrillas, especialidades y miembros.
* **CU-20:** Registrar y aplicar solicitudes institucionales de alta, cambio o baja de funciones y
  conformación de cuadrillas; gestionar los roles de usuarios.
* **CU-29:** Consultar y configurar los umbrales operativos.
* **CU-33:** Configurar y probar proveedores y credenciales de IA.
* **CU-34:** Consultar métricas, procedencia y limitaciones de los modelos predictivos.
* **CU-39:** Reentrenar y volver a comparar los modelos predictivos.

## Autoridad municipal

* **CU-34:** Consultar métricas y procedencia del modelo.
* **CU-36:** Consultar la comparación agregada entre casos observados y estimados.
* **CU-38:** Consultar el historial agregado de decisiones y precisión retrospectiva.

## Público / Auditor de sistemas

* **CU-15:** Consultar el estado de los microservicios, su latencia y el historial de uptime.
