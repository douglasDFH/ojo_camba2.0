# Anexos {.sin-numero}

## Anexo A. Escenarios Gherkin de HU-24

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

## Anexo B. Escenarios Gherkin de HU-25

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

## Anexo C. Escenarios Gherkin de HU-26

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

## Anexo D. Escenarios Gherkin de HU-27

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
