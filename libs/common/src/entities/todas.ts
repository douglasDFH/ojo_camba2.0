import { Reporte } from './reporte.entity';
import { Dispositivo } from './dispositivo.entity';
import { Categoria } from './categoria.entity';
import { GrupoReporte } from './grupo-reporte.entity';
import { Especialidad } from './especialidad.entity';
import { Cuadrilla } from './cuadrilla.entity';
import { CuadrillaMiembro } from './cuadrilla-miembro.entity';
import { VisitaCaso } from './visita-caso.entity';
import { PropuestaVisita } from './propuesta-visita.entity';
import { ConfiguracionOperativa } from './configuracion-operativa.entity';
import { DerivacionCaso } from './derivacion-caso.entity';
import { DecisionRecomendacion } from './decision-recomendacion.entity';
import { SolicitudTi } from './solicitud-ti.entity';
import { SolicitudTiUsuario } from './solicitud-ti-usuario.entity';
import { ActualizacionCaso } from './actualizacion-caso.entity';
import { Usuario } from './usuario.entity';
import { Rol } from './rol.entity';
import { UsuarioRol } from './usuario-rol.entity';
import { RefreshToken } from './refresh-token.entity';
import { Nivel } from './nivel.entity';
import { HistorialPuntos } from './historial-puntos.entity';
import { PingLog } from './ping-log.entity';
import { AiProviderConfig } from './ai-provider-config.entity';

/**
 * Todas las entidades del esquema. Cada servicio las registra completas en su
 * conexión: las entidades declaran relaciones entre sí (las llaves foráneas) y
 * TypeORM no arranca si una relación apunta a una entidad que esa conexión no
 * conoce. `forFeature` sigue definiendo qué repositorios inyecta cada servicio.
 */
export const ENTIDADES = [
  Reporte,
  Dispositivo,
  Categoria,
  GrupoReporte,
  Especialidad,
  Cuadrilla,
  CuadrillaMiembro,
  VisitaCaso,
  PropuestaVisita,
  ConfiguracionOperativa,
  DerivacionCaso,
  DecisionRecomendacion,
  SolicitudTi,
  SolicitudTiUsuario,
  ActualizacionCaso,
  Usuario,
  Rol,
  UsuarioRol,
  RefreshToken,
  Nivel,
  HistorialPuntos,
  PingLog,
  AiProviderConfig,
];
