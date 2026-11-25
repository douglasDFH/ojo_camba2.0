# Fichas de Historias de Usuario — Ojo Camba

**Descripción:** Fichas de historias de usuario derivadas del análisis del código
actual (backend `ms-admin`, `ms-ia`, `gateway-principal` y las apps de
backoffice y técnico). Continúan la numeración del Product Backlog de 23
historias (HU-01 a HU-23, `docs/words/src/act4.js`): cubren funcionalidad que ya
existe en el código —IA, operación de campo y predicción— pero que no tenía
historia escrita en ese backlog ni en `docs/backlog.md`.

---

## Ficha HU-24 — Triaje asistido de gravedad

| Campo | Valor |
|-------|-------|
| **ID** | HU-24 |
| **Título** | Sugerencia explicable de gravedad para un reporte |
| **Actor** | Moderador comunitario / Coordinador |
| **Módulo** | Backoffice · `ms-ia` (`triaje/triaje.service.ts`) |
| **Prioridad** | Alta |
| **Estimación** | 5 puntos |
| **Caso de uso relacionado** | CU-07 (validar y aceptar un reporte) |

**Historia**

> **Como** moderador, **quiero** que el sistema me sugiera la gravedad de un
> reporte explicando qué reglas aplicó, **para** priorizar la bandeja sin
> depender solo de mi criterio y poder justificar la decisión.

**Criterios de aceptación**

1. La sugerencia se calcula a partir de hechos: tipo (según la categoría),
   temporada, ubicación sensible (vía principal, escuela, hospital), recurrencia
   de reportes cercanos, horas transcurridas y palabra clave de riesgo.
2. La temporada es la de la **fecha del reporte**, no la del día del triaje
   (noviembre–marzo = lluvias). El moderador puede forzarla (p. ej. un surazo).
3. La respuesta incluye la gravedad sugerida, la acción recomendada y una
   **traza** con cada regla aplicada y su conclusión.
4. Si falta `categoria_id` o `creado_en`, el sistema responde error 400 con un
   mensaje claro.
5. Es solo una sugerencia: el moderador decide la gravedad final.

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

---

## Ficha HU-25 — Recomendación de cuadrilla para un Caso de Obra

| Campo | Valor |
|-------|-------|
| **ID** | HU-25 |
| **Título** | Recomendar la cuadrilla más adecuada para un caso |
| **Actor** | Coordinador de operaciones |
| **Módulo** | Backoffice · `ms-ia` (`cuadrillas/recomendacion.service.ts`) · `ms-admin` |
| **Prioridad** | Alta |
| **Estimación** | 5 puntos |
| **Caso de uso relacionado** | CU-07, CU-08 |

**Historia**

> **Como** coordinador, **quiero** recibir un ranking de cuadrillas para cada
> Caso de Obra según especialidad, carga de trabajo y disponibilidad, **para**
> asignar el caso a la cuadrilla correcta sin sobrecargar a ninguna.

**Criterios de aceptación**

1. El sistema puntúa solo cuadrillas activas y devuelve un ranking con la
   recomendada primero.
2. La especialidad pesa más que la carga: una cuadrilla cuya especialidad
   coincide con la categoría del caso (60 pts) supera a una sin especialidad
   (20 pts) salvo que tenga muchos más casos activos.
3. Cada cuadrilla del ranking muestra sus casos activos y los **motivos** del
   puntaje; la respuesta incluye la traza de reglas.
4. Si el caso ya tiene cuadrilla, se muestra como `cuadrilla_actual`.
5. Al asignar la cuadrilla se crea automáticamente una visita pendiente para
   ese caso.

```gherkin
Característica: Recomendación de cuadrilla

  Escenario: Gana la cuadrilla con la especialidad correcta
    Dado un Caso de Obra de categoría "Drenaje"
    Y la cuadrilla A tiene especialidad "Drenaje" y 3 casos activos
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

---

## Ficha HU-26 — Resultado de visita de campo con confirmación

| Campo | Valor |
|-------|-------|
| **ID** | HU-26 |
| **Título** | Proponer el resultado de una visita y que la autoridad lo confirme |
| **Actor** | Técnico en campo · Responsable de cuadrilla / Coordinador |
| **Módulo** | App Técnico · `ms-admin` (`operacion.service.ts`) |
| **Prioridad** | Alta |
| **Estimación** | 8 puntos |
| **Caso de uso relacionado** | CU-12, CU-13, CU-14 |

**Historia**

> **Como** técnico en campo, **quiero** registrar mi llegada al lugar y proponer
> el resultado de la visita con evidencia, **para** que las decisiones
> definitivas (finalizar, derivar o rechazar) queden confirmadas por la
> autoridad y el ciudadano vea un estado confiable.

**Criterios de aceptación**

1. Solo el técnico asignado a la visita puede registrar la llegada (con GPS
   válido) y proponer el resultado.
2. No se puede proponer resultado sin haber registrado la llegada, ni si ya hay
   una propuesta pendiente en esa visita.
3. La propuesta exige descripción. Los resultados terminales (`Finalizado`,
   `Derivado`, `RechazadoCampo`) exigen **evidencia** (foto).
4. `Derivado` exige entidad de destino; `RechazadoCampo` exige categoría de
   rechazo.
5. `EnTrabajo` y `Reencolado` se aplican al instante y abren una nueva visita
   (al mismo técnico en `EnTrabajo`; sin técnico en `Reencolado`).
6. Los terminales quedan como propuesta **pendiente** hasta que la autoridad la
   acepte o rechace; todo queda registrado en la bitácora del caso.
7. Solo se permiten transiciones definidas en `TRANSICIONES_CASO`.

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

---

## Ficha HU-27 — Decisión registrada sobre una alerta de capacidad

| Campo | Valor |
|-------|-------|
| **ID** | HU-27 |
| **Título** | Aceptar, modificar o descartar una recomendación del pronóstico |
| **Actor** | Coordinador · Autoridad municipal (solo consulta) |
| **Módulo** | Backoffice `/prediccion` · `ms-admin` (`prediccion-decisiones.service.ts`) · `ms-prediccion` |
| **Prioridad** | Media |
| **Estimación** | 5 puntos |
| **Caso de uso relacionado** | Panel de decisión (ISSUE-32) |

**Historia**

> **Como** coordinador, **quiero** ver el pronóstico de casos por zona junto a
> lo observado y registrar mi decisión sobre cada alerta con un motivo,
> **para** dejar una decisión auditable y medir después qué tan preciso fue el
> modelo.

**Criterios de aceptación**

1. La comparativa muestra lo observado y lo estimado **por separado**, cada uno
   con su origen y período; nunca los funde en un solo número.
2. Sin modelo entrenado la comparativa igual responde: lo estimado viene en
   `null` con el motivo y lo observado se muestra completo.
3. La decisión (aceptar, modificar, descartar) exige un motivo de al menos 10
   caracteres y la zona de la recomendación.
4. La decisión se atribuye al usuario del token y guarda una copia de la
   recomendación vista en ese momento.
5. El historial muestra pronóstico, casos observados y error retrospectivo.
6. La autoridad municipal puede ver comparativa e historial, pero no las alertas
   ni registrar decisiones.

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

---

## Trazabilidad

| HU | Código principal | Issue / documento |
|----|------------------|-------------------|
| HU-24 | `backend/ms-ia/src/triaje/triaje.service.ts` | Bloque 2 / ISSUE-12 (permisos IA) |
| HU-25 | `backend/ms-ia/src/cuadrillas/recomendacion.service.ts` | Bloque 2 (reparto) |
| HU-26 | `backend/ms-admin/src/operacion.service.ts` | Bloque 2 (propuesta y confirmación), ISSUE-29 |
| HU-27 | `backend/ms-admin/src/prediccion-decisiones.service.ts` | ISSUE-31, ISSUE-32 |
