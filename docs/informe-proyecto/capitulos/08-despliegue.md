# Despliegue {#despliegue}

## Entorno de desarrollo

En desarrollo, PostgreSQL con PostGIS y h3-pg y el almacenamiento SeaweedFS corren en contenedores Docker. Los
servicios NestJS y las aplicaciones React se levantan en modo observación con un solo comando del monorepo, y
el servicio de predicción corre en su propio contenedor con Python 3.12. Un script verifica que todos los
servicios respondan, y los datos iniciales —roles, usuarios de prueba, categorías y niveles— se cargan con
comandos de semilla. La base se crea y actualiza solo mediante migraciones.

## Producción

El sistema se despliega en Coolify como doce servicios, cada uno con su propio Dockerfile de producción en
varias etapas (@tabla:despliegue). Solo los gateways y las aplicaciones tienen acceso público; los
microservicios quedan en la red interna, y al de predicción se llega únicamente a través del gateway
principal, que es donde se comprueban los roles.

Tabla: Servicios desplegados en producción {#despliegue anchos=4.2,4.3,3.2,4.3}

| Grupo | Servicios | Protocolo | Acceso |
|-------|-----------|-----------|--------|
| Microservicios | `ms-auth`, `ms-register`, `ms-admin`, `ms-gamify`, `ms-ia` | TCP | Interno |
| Predicción | `ms-prediccion` | HTTP interno | Interno |
| Gateways | `gateway-principal`, `gateway-status` | HTTP | Público |
| Aplicaciones | `app-reporte`, `app-backoffice`, `app-tecnico`, `app-status` | HTTP | Público |

El orden de despliegue es la base de datos, el almacenamiento, los microservicios, los gateways y, al final,
las aplicaciones. Coolify vuelve a desplegar solo los servicios cuyos archivos cambiaron. El servicio de
predicción necesita dos volúmenes persistentes, uno para el modelo entrenado y otro para el clima en caché,
porque el entrenamiento no corre al arrancar a propósito. Cada despliegue requiere aplicar las migraciones
pendientes y definir los secretos propios de cada servicio, como la clave de firma de los tokens y la clave
maestra que cifra las credenciales de inteligencia artificial.

Una vez desplegado, la aplicación pública de estado permite verificar en todo momento que cada
microservicio esté operativo.
