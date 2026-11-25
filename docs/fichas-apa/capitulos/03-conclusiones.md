# Conclusiones y Recomendaciones {#conclusiones}

## Conclusiones

Se identificaron en el código fuente cuatro funcionalidades implementadas que no tenían historia de usuario
en el Product Backlog: el triaje asistido de gravedad, la recomendación de cuadrillas, el resultado de la
visita de campo y las decisiones sobre el pronóstico.

Cada funcionalidad quedó documentada como una ficha con su actor, módulo, caso de uso relacionado y
criterios de aceptación tomados de las validaciones que el código aplica (@sec:desarrollo).

Las cuatro historias se expresaron en escenarios Gherkin, reunidos en los anexos, que describen
comportamientos observables y pueden automatizarse como pruebas.

La tabla de trazabilidad relaciona cada historia con el archivo que la implementa, lo que permite verificar
cada criterio directamente en el código (@sec:trazabilidad).

## Recomendaciones

Confirmar en la próxima sesión de Planning Poker la prioridad y la estimación propuestas para HU-24 a HU-27,
e incorporar las cuatro historias al Product Backlog.

Automatizar los escenarios de los anexos que todavía no tienen una prueba que los cubra.

Mantener la práctica de este informe: cuando se implemente una funcionalidad nueva, redactar su historia de
usuario en el mismo cambio para que el backlog no vuelva a quedar desactualizado respecto del código.
