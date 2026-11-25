# Anexos {.sin-numero}

## Anexo A. Fichas de las historias de usuario HU-24 a HU-27

Las fichas documentan funcionalidad implementada que no tenía historia de usuario. Sus criterios de aceptación se tomaron de las validaciones que aplica el código.

### HU-24. Triaje asistido de gravedad

El triaje ayuda al moderador a decidir qué tan grave es un reporte a partir de hechos verificables. El
sistema explica cada regla que aplicó, de modo que la sugerencia se puede justificar y corregir
(@tabla:ficha-hu24).

Tabla: Ficha de la historia HU-24 {#ficha-hu24 anchos=4.5,11.5}

| Campo | Valor |
|-------|-------|
| Identificador | HU-24 |
| Título | Sugerencia explicable de gravedad para un reporte |
| Actor | Moderador comunitario / Coordinador |
| Módulo | Backoffice; `ms-ia` (`triaje/triaje.service.ts`) |
| Caso de uso relacionado | CU-07 (validar y aceptar un reporte) |
| Prioridad | Alta [[verificar: propuesta, confirmar en Planning Poker]] |
| Estimación | 5 puntos [[verificar: propuesta, confirmar en Planning Poker]] |

**Historia.** *Como moderador, quiero que el sistema me sugiera la gravedad de un reporte explicando qué
reglas aplicó, para priorizar la bandeja sin depender solo de mi criterio y poder justificar la decisión.*

**Criterios de aceptación.**

1. La sugerencia se calcula a partir de hechos: el tipo de problema según la categoría, la temporada, la
   ubicación sensible (vía principal, escuela u hospital), la recurrencia de reportes cercanos, las horas
   transcurridas y la presencia de una palabra clave de riesgo.
2. La temporada corresponde a la fecha del reporte y no a la del día del triaje; de noviembre a marzo es
   temporada de lluvias. El moderador puede forzar la temporada cuando el clima real no coincide con el
   calendario, por ejemplo durante un surazo.
3. La respuesta incluye la gravedad sugerida, la acción recomendada y una traza con cada regla aplicada y su
   conclusión.
4. Si falta la categoría o la fecha de creación del reporte, el sistema responde con un error 400 y un
   mensaje claro.
5. La gravedad sugerida es solo una sugerencia: el moderador decide la gravedad final.

Los escenarios en Gherkin de esta historia están en el Anexo B.

### HU-25. Recomendación de cuadrilla para un Caso de Obra

Esta historia cubre la asignación de un Caso de Obra a la cuadrilla que mejor puede atenderlo, combinando su
especialidad con su carga de trabajo actual (@tabla:ficha-hu25).

Tabla: Ficha de la historia HU-25 {#ficha-hu25 anchos=4.5,11.5}

| Campo | Valor |
|-------|-------|
| Identificador | HU-25 |
| Título | Recomendar la cuadrilla más adecuada para un caso |
| Actor | Coordinador de operaciones |
| Módulo | Backoffice; `ms-ia` (`cuadrillas/recomendacion.service.ts`); `ms-admin` |
| Caso de uso relacionado | CU-07, CU-08 |
| Prioridad | Alta [[verificar: propuesta, confirmar en Planning Poker]] |
| Estimación | 5 puntos [[verificar: propuesta, confirmar en Planning Poker]] |

**Historia.** *Como coordinador, quiero recibir un ranking de cuadrillas para cada Caso de Obra según su
especialidad, su carga de trabajo y su disponibilidad, para asignar el caso a la cuadrilla correcta sin
sobrecargar a ninguna.*

**Criterios de aceptación.**

1. El sistema puntúa solo las cuadrillas activas y devuelve un ranking con la recomendada en primer lugar.
2. La especialidad pesa más que la carga: una cuadrilla cuya especialidad coincide con la categoría del caso
   recibe 60 puntos y una sin especialidad recibe 20, de modo que solo una diferencia grande de casos
   activos invierte el orden.
3. Cada cuadrilla del ranking muestra sus casos activos y los motivos de su puntaje; la respuesta incluye
   la traza de las reglas aplicadas.
4. Si el caso ya tiene una cuadrilla asignada, la respuesta la muestra como cuadrilla actual.
5. Al asignar la cuadrilla se crea automáticamente una visita pendiente para ese caso.

Los escenarios en Gherkin de esta historia están en el Anexo B.

### HU-26. Resultado de la visita de campo con confirmación

La visita de campo es el momento en que un técnico comprueba el problema en el lugar. Esta historia separa
lo que el técnico puede decidir solo de lo que requiere la confirmación de una autoridad
(@tabla:ficha-hu26).

Tabla: Ficha de la historia HU-26 {#ficha-hu26 anchos=4.5,11.5}

| Campo | Valor |
|-------|-------|
| Identificador | HU-26 |
| Título | Proponer el resultado de una visita y que la autoridad lo confirme |
| Actor | Técnico en campo; responsable de cuadrilla o coordinador |
| Módulo | App Técnico; `ms-admin` (`operacion.service.ts`) |
| Caso de uso relacionado | CU-12, CU-13, CU-14 |
| Prioridad | Alta [[verificar: propuesta, confirmar en Planning Poker]] |
| Estimación | 8 puntos [[verificar: propuesta, confirmar en Planning Poker]] |

**Historia.** *Como técnico en campo, quiero registrar mi llegada al lugar y proponer el resultado de la
visita con evidencia, para que las decisiones definitivas —finalizar, derivar o rechazar— queden
confirmadas por la autoridad y el ciudadano vea un estado confiable.*

**Criterios de aceptación.**

1. Solo el técnico asignado a la visita puede registrar la llegada, con una posición GPS válida, y proponer
   el resultado.
2. No se puede proponer un resultado sin haber registrado la llegada, ni cuando la visita ya tiene una
   propuesta pendiente.
3. Toda propuesta exige una descripción. Los resultados terminales (`Finalizado`, `Derivado` y
   `RechazadoCampo`) exigen además una fotografía como evidencia.
4. `Derivado` exige la entidad de destino y `RechazadoCampo` exige una categoría de rechazo.
5. `EnTrabajo` y `Reencolado` se aplican al instante y abren una nueva visita: con el mismo técnico en
   `EnTrabajo` y sin técnico en `Reencolado`, para que el responsable la redistribuya.
6. Los resultados terminales quedan como propuesta pendiente hasta que la autoridad la acepte o la
   rechace, y todo queda registrado en la bitácora del caso.
7. Solo se permiten las transiciones de estado definidas en el flujo aprobado del Caso de Obra.

Los escenarios en Gherkin de esta historia están en el Anexo B.

### HU-27. Decisión registrada sobre una alerta de capacidad

El panel de decisión muestra cuántos casos se esperan por zona y alerta cuando la capacidad de las
cuadrillas no alcanza. Esta historia asegura que cada decisión sobre una alerta quede justificada y se pueda
auditar (@tabla:ficha-hu27).

Tabla: Ficha de la historia HU-27 {#ficha-hu27 anchos=4.5,11.5}

| Campo | Valor |
|-------|-------|
| Identificador | HU-27 |
| Título | Aceptar, modificar o descartar una recomendación del pronóstico |
| Actor | Coordinador; autoridad municipal (solo consulta) |
| Módulo | Backoffice (`/prediccion`); `ms-admin` (`prediccion-decisiones.service.ts`); `ms-prediccion` |
| Caso de uso relacionado | Panel de decisión (ISSUE-32) |
| Prioridad | Media [[verificar: propuesta, confirmar en Planning Poker]] |
| Estimación | 5 puntos [[verificar: propuesta, confirmar en Planning Poker]] |

**Historia.** *Como coordinador, quiero ver el pronóstico de casos por zona junto a lo observado y registrar
mi decisión sobre cada alerta con un motivo, para dejar una decisión auditable y medir después qué tan
preciso fue el modelo.*

**Criterios de aceptación.**

1. La comparativa muestra lo observado y lo estimado por separado, cada uno con su origen y su período, y
   nunca los funde en un solo número.
2. Sin un modelo entrenado la comparativa igual responde: lo estimado aparece vacío con el motivo y lo
   observado se muestra completo.
3. La decisión —aceptar, modificar o descartar— exige un motivo de al menos diez caracteres y la zona de la
   recomendación.
4. La decisión se atribuye al usuario que inició sesión y guarda una copia de la recomendación tal como se
   mostró en ese momento.
5. El historial muestra el pronóstico, los casos observados y el error retrospectivo.
6. La autoridad municipal puede consultar la comparativa y el historial, pero no las alertas ni registrar
   decisiones.

Los escenarios en Gherkin de esta historia están en el Anexo B.

## Anexo B. Escenarios Gherkin de las historias HU-24 a HU-27

### Escenarios de HU-24

```gherkin
Característica: Triaje asistido de gravedad

  Escenario: Reporte en temporada de lluvias cerca de una escuela
    Dado un reporte de canal obstruido creado en enero
    Y la ubicación sensible es "escuela"
    Cuando el moderador abre el reporte en la bandeja
    Entonces el sistema muestra una gravedad sugerida
    Y la traza explica la regla de temporada "lluvias" y la de ubicación sensible

  Escenario: El moderador corrige la temporada
    Dado un reporte creado en julio (temporada seca por calendario)
    Cuando el moderador fuerza la temporada "lluvias"
    Entonces la sugerencia se recalcula usando la temporada forzada

  Escenario: Faltan datos obligatorios
    Dado una solicitud de triaje sin categoria_id
    Cuando se pide la sugerencia
    Entonces el sistema responde 400 "categoria_id es requerido."
```

### Escenarios de HU-25

```gherkin
Característica: Recomendación de cuadrilla

  Escenario: Gana la cuadrilla con la especialidad correcta
    Dado un Caso de Obra de categoría "Alcantarillado"
    Y la cuadrilla A tiene la especialidad de esa categoría y 3 casos activos
    Y la cuadrilla B no tiene especialidad y 1 caso activo
    Cuando el coordinador pide la recomendación
    Entonces la cuadrilla A aparece como recomendada
    Y cada cuadrilla muestra los motivos de su puntaje

  Escenario: Cuadrillas inactivas no se recomiendan
    Dado que la cuadrilla C está inactiva
    Cuando el coordinador pide la recomendación
    Entonces la cuadrilla C no aparece en el ranking

  Escenario: Asignar la cuadrilla recomendada
    Cuando el coordinador asigna la cuadrilla A al caso
    Entonces se crea una visita abierta para la cuadrilla A
```

### Escenarios de HU-26

```gherkin
Característica: Resultado de visita de campo

  Escenario: El técnico propone finalizar el caso
    Dado que el técnico asignado registró su llegada a la visita
    Cuando propone "Finalizado" con descripción y foto de evidencia
    Entonces se crea una propuesta en estado "Pendiente"
    Y la bitácora registra "Propuesta de Finalizado"
    Y el estado del caso no cambia hasta la confirmación

  Escenario: Finalizar sin evidencia
    Dado que el técnico registró su llegada
    Cuando propone "Finalizado" sin foto
    Entonces el sistema responde "La decisión terminal requiere evidencia."

  Escenario: La obra continúa
    Dado que el técnico registró su llegada
    Cuando propone "EnTrabajo" con una descripción
    Entonces el caso pasa a "EnTrabajo" de inmediato
    Y se abre una nueva visita para el mismo técnico

  Escenario: Otro técnico intenta proponer
    Dado una visita asignada al técnico A
    Cuando el técnico B intenta proponer un resultado
    Entonces el sistema responde 403 "Solo el técnico asignado puede proponer el resultado."
```

### Escenarios de HU-27

```gherkin
Característica: Decisiones sobre el pronóstico

  Escenario: El coordinador acepta una alerta
    Dado una alerta de capacidad al 100% en una zona H3
    Cuando el coordinador la acepta con el motivo "Reforzamos la cuadrilla norte esta semana"
    Entonces la decisión queda registrada a su nombre
    Y se guarda una copia de la recomendación original

  Escenario: Motivo insuficiente
    Cuando el coordinador intenta descartar una alerta con el motivo "no"
    Entonces el sistema responde 400 indicando el mínimo de 10 caracteres

  Escenario: Sin modelo entrenado
    Dado que nadie entrenó el modelo todavía
    Cuando el coordinador abre la comparativa
    Entonces ve los casos observados completos
    Y lo estimado aparece vacío con el motivo

  Escenario: La autoridad no puede decidir
    Dado un usuario con rol autoridad
    Cuando intenta registrar una decisión
    Entonces el sistema le niega el acceso
```
