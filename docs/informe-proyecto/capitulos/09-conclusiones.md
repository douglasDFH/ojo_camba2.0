# Conclusiones y recomendaciones {#conclusiones}

## Conclusiones

Ojo Camba permite que cualquier ciudadano, con o sin cuenta, reporte un problema urbano desde su teléfono con
una fotografía y su ubicación real, incluso sin conexión en el momento del envío.

El Backoffice valida y agrupa los reportes en Casos de Obra con mecanismos que evitan el trabajo duplicado:
moderación en tiempo real con bloqueo entre moderadores, búsqueda del caso activo de la zona y bloqueo
pesimista al aceptar.

La operación de campo quedó organizada de punta a punta: cuadrillas con un responsable, visitas distribuidas
en una ruta diaria, llegada verificada con GPS y resultados terminales que exigen evidencia y la confirmación
de una autoridad, todo registrado en una bitácora pública.

La coordinación y la autoridad municipal disponen de soporte a la decisión: indicadores, alertas de
capacidad y un pronóstico de demanda presentado siempre separado de lo observado, con decisiones
justificadas y auditables. En los módulos de inteligencia artificial y de predicción se mantiene un mismo
principio: el sistema sugiere y explica, y la decisión final queda en una persona.

La calidad se sostiene con 298 pruebas unitarias y 43 de extremo a extremo, integración continua y un control
previo a cada commit; la revisión más reciente encontró y corrigió un desfase entre las entidades y la base
de datos y un error en el panel de decisión antes de que llegaran a los usuarios.

## Recomendaciones

Aplicar la guía de entrevista con funcionarios municipales para validar los flujos con la operación real,
una tarea que quedó fuera del ciclo académico.

Reentrenar el modelo de predicción con datos reales cuando el sistema acumule historia propia, ya que el
modelo vigente se entrenó con casos sintéticos.

Incorporar a la integración continua las pruebas de `ms-prediccion` y la comprobación de desfase entre
entidades y base de datos.

Confirmar con el equipo la prioridad y la estimación de las historias HU-24 a HU-27 e incorporarlas al
Product Backlog.

Actualizar la documentación técnica del repositorio que quedó atrás del código —el README y los diagramas de
arquitectura y del modelo de datos en formato Mermaid—, para que vuelva a describir los servicios de
inteligencia artificial y de predicción y la operación de campo.
