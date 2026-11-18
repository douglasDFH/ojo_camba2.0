import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Issue #4: hasta ahora solo usuario_roles y refresh_tokens tenían llaves
 * foráneas, y reportes solo tenía la llave primaria.
 *
 * Llaves foráneas: qué pasa al borrar sigue el diagrama de clases.
 *  - Composición (la parte no existe sin el todo): la bitácora, las visitas,
 *    las propuestas y las derivaciones se borran con su caso (CASCADE).
 *  - Agregación: un reporte sobrevive a su caso y queda sin agrupar (SET NULL).
 *  - Referencias a catálogos, cuadrillas y autores: se impide el borrado
 *    (RESTRICT), salvo autor opcional o técnico asignado (SET NULL).
 * reportes.device_id no lleva llave foránea: el dispositivo se registra
 * después de guardar el reporte (ms-register) y el simulador los inserta por
 * separado.
 *
 * Índices: las consultas de aceptación (caso activo por hexágono H3), mapa de
 * calor, bandejas por estado, casos del ciudadano y el límite de reportes por
 * dispositivo por hora recorrían toda la tabla de reportes.
 *
 * Cada llave se crea NOT VALID y luego se valida: si hubiera filas huérfanas,
 * la migración falla con el nombre de la llave en vez de dejarla a medias.
 */
const LLAVES: Array<[tabla: string, columna: string, destino: string, alBorrar: string]> = [
  ['reportes', 'grupo_id', 'grupos_reportes', 'SET NULL'],
  ['reportes', 'categoria_id', 'categorias', 'RESTRICT'],
  ['reportes', 'usuario_id', 'usuarios', 'SET NULL'],
  ['grupos_reportes', 'categoria_id', 'categorias', 'RESTRICT'],
  ['grupos_reportes', 'cuadrilla_id', 'cuadrillas', 'RESTRICT'],
  ['grupos_reportes', 'creado_por_usuario_id', 'usuarios', 'RESTRICT'],
  ['visitas_caso', 'grupo_id', 'grupos_reportes', 'CASCADE'],
  ['visitas_caso', 'cuadrilla_id', 'cuadrillas', 'RESTRICT'],
  ['visitas_caso', 'tecnico_id', 'usuarios', 'SET NULL'],
  ['actualizaciones_caso', 'grupo_id', 'grupos_reportes', 'CASCADE'],
  ['actualizaciones_caso', 'usuario_id', 'usuarios', 'RESTRICT'],
  ['derivaciones_caso', 'grupo_id', 'grupos_reportes', 'CASCADE'],
  ['propuestas_visita', 'visita_id', 'visitas_caso', 'CASCADE'],
  ['cuadrilla_miembros', 'cuadrilla_id', 'cuadrillas', 'CASCADE'],
  ['cuadrilla_miembros', 'usuario_id', 'usuarios', 'CASCADE'],
  ['cuadrillas', 'especialidad_id', 'especialidades', 'SET NULL'],
  ['historial_puntos', 'usuario_id', 'usuarios', 'CASCADE'],
  ['historial_puntos', 'report_id', 'reportes', 'SET NULL'],
  ['usuarios', 'nivel_id', 'niveles', 'SET NULL'],
];

const INDICES: Array<[nombre: string, tabla: string, columnas: string]> = [
  ['IDX_reportes_h3_res_11', 'reportes', '"h3_res_11"'],
  ['IDX_reportes_h3_res_8', 'reportes', '"h3_res_8"'],
  ['IDX_reportes_grupo', 'reportes', '"grupo_id"'],
  ['IDX_reportes_estado_creado', 'reportes', '"estado", "creado_en"'],
  ['IDX_reportes_dispositivo_creado', 'reportes', '"device_id", "creado_en"'],
  ['IDX_reportes_usuario', 'reportes', '"usuario_id"'],
  ['IDX_grupos_reportes_estado', 'grupos_reportes', '"estado_actual"'],
  ['IDX_ping_log_creado', 'ping_log', '"creado_en"'],
];

const nombreLlave = (tabla: string, columna: string) => `FK_${tabla}_${columna}`;

export class IntegridadReferencialEIndices1788600000000 implements MigrationInterface {
  name = 'IntegridadReferencialEIndices1788600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [tabla, columna, destino, alBorrar] of LLAVES) {
      const nombre = nombreLlave(tabla, columna);
      await queryRunner.query(`ALTER TABLE "${tabla}" DROP CONSTRAINT IF EXISTS "${nombre}"`);
      await queryRunner.query(
        `ALTER TABLE "${tabla}" ADD CONSTRAINT "${nombre}" FOREIGN KEY ("${columna}")
           REFERENCES "${destino}"("id") ON DELETE ${alBorrar} NOT VALID`,
      );
      await queryRunner.query(`ALTER TABLE "${tabla}" VALIDATE CONSTRAINT "${nombre}"`);
    }
    for (const [nombre, tabla, columnas] of INDICES) {
      await queryRunner.query(`CREATE INDEX IF NOT EXISTS "${nombre}" ON "${tabla}" (${columnas})`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [nombre] of INDICES) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${nombre}"`);
    }
    for (const [tabla, columna] of LLAVES) {
      await queryRunner.query(
        `ALTER TABLE "${tabla}" DROP CONSTRAINT IF EXISTS "${nombreLlave(tabla, columna)}"`,
      );
    }
  }
}
