# Implementación {#implementacion}

## Reporte ciudadano

La aplicación de reporte obliga a usar la cámara y el GPS del teléfono: un reporte siempre lleva una
fotografía tomada en el momento y la ubicación real. Puede enviarse sin cuenta, identificado por el
dispositivo. Si no hay conexión, el reporte se guarda en una cola local y se envía solo cuando vuelve la
señal.

Al recibirlo, `ms-register` valida que la ubicación esté dentro del área metropolitana de Santa Cruz de la
Sierra —un punto fuera de ese recuadro es un error de GPS o un intento de ensuciar el mapa—, rechaza los
dispositivos bloqueados y limita a diez los reportes por dispositivo y por hora. Después calcula los tres
índices H3, guarda la imagen en el almacenamiento de objetos y registra el reporte como `Reportado`. El
ciudadano puede seguir su reporte, ver la bitácora pública del caso y compartir el enlace.

## Moderación en el Backoffice

La bandeja del Backoffice recibe los reportes nuevos en tiempo real, sin recargar la página. Cuando un
moderador abre un reporte lo toma, y los demás ven un candado para no revisar lo mismo dos veces. Al aceptar,
el sistema busca un Caso de Obra activo de la misma categoría en la zona y le agrega el reporte; si no hay
ninguno, crea un caso nuevo. Esa operación usa un bloqueo pesimista de fila, de modo que dos aceptaciones
simultáneas del mismo reporte no generan dos casos. El moderador también puede descartar un reporte con un
motivo, agrupar reportes cercanos y bloquear dispositivos que envían spam. Todas las decisiones alimentan un
panel de calidad de la moderación.

## Casos de Obra y operación de campo

La coordinación asigna cada caso a una cuadrilla, y esa asignación crea automáticamente una visita
pendiente. El responsable de la cuadrilla distribuye las visitas entre sus técnicos, con una fecha y un orden
dentro de la ruta del día. El técnico ve su ruta en la aplicación de campo, registra su llegada con el GPS y,
desde ese momento, puede escribir en la bitácora de obra y proponer el resultado de la visita.

Los resultados que no cierran el caso —la obra empezó o no se pudo trabajar— se aplican al instante y abren
la visita siguiente. Los resultados terminales —finalizado, derivado a otra entidad o rechazado en campo—
exigen una fotografía como evidencia y quedan pendientes hasta que la autoridad que corresponde los
confirma. La carga de cada cuadrilla se controla con umbrales configurables: desde ocho reportes abiertos el
sistema advierte, y no permite superar diez.

## Gamificación

Cada reporte aceptado suma diez puntos a la cuenta del ciudadano, y el puntaje define su nivel: Bronce desde
cero puntos, Plata desde cincuenta y Oro desde doscientos. Si el reporte se agrupa después en un Caso de Obra,
el ciudadano conserva sus puntos.

## Inteligencia artificial

`ms-ia` reúne tres funciones de apoyo a la decisión. El triaje sugiere la gravedad de un reporte a partir de
hechos —tipo de problema, temporada, ubicación sensible, recurrencia en la zona y horas transcurridas— y
explica cada regla que aplicó. La recomendación de cuadrillas ordena las cuadrillas activas según su
especialidad y su carga de trabajo. El asistente responde preguntas del Backoffice en lenguaje natural usando
herramientas del propio sistema: resumen de pendientes, listado de casos, explicación del triaje, de la ruta
sugerida y de la recomendación de cuadrilla; además, puede proponer los hechos de un reporte a partir de su
fotografía.

Los modelos de lenguaje se consumen a través de proveedores intercambiables —Groq, Gemini, DeepSeek y OpenAI—
ordenados por prioridad: si uno falla, el sistema intenta con el siguiente. El encargado IT configura las
claves desde el Backoffice y se guardan cifradas con AES-256-GCM. En todos los casos la IA sugiere y la
persona decide.

## Predicción de demanda y panel de decisión

`ms-prediccion` estima cuántos Casos de Obra se abrirán la semana siguiente en cada zona H3 de resolución 8 y
para cada categoría. El entrenamiento compara tres modelos —regresión lineal, árbol de decisión y bosque
aleatorio— con una separación temporal, y elige el de menor error absoluto medio en las semanas de prueba.
En el entrenamiento vigente ganó la regresión lineal, con un error medio de 0,897 casos en doce semanas no
vistas. El conjunto de datos cubre 83 semanas, 18 zonas y 6 categorías; los casos provienen de un simulador
con reglas conocidas y el clima, de Open-Meteo. Un documento de auditoría registra los sesgos detectados, las
variables excluidas para evitar fugas de información y los límites de uso del modelo.

A partir del pronóstico y de la capacidad de las cuadrillas, el servicio genera alertas cuando la demanda
esperada alcanza el 80 % o el 100 % de la capacidad. El panel de decisión del Backoffice muestra lo observado
y lo estimado siempre por separado y nunca como una sola cifra. El coordinador registra su decisión sobre
cada alerta —aceptarla, modificarla o descartarla— con un motivo obligatorio, y el historial mide después el
error del pronóstico frente a lo que ocurrió. La autoridad municipal consulta los agregados, pero no opera
sobre las alertas.

## Monitoreo público

`gateway-status` consulta cada minuto a cada microservicio y guarda el resultado. La aplicación pública de
estado muestra si cada servicio está operativo o interrumpido y su disponibilidad diaria de los últimos
treinta días.
