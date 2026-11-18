import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Issue #3: el código de obra (O-AA-0000001) se calculaba como «cantidad de
 * casos + 1». Dos aceptaciones simultáneas obtenían el mismo número y una
 * fallaba por la restricción única; además chocaba con los casos que crea el
 * seed de demo con otro formato. Una secuencia de PostgreSQL entrega números
 * únicos aunque haya concurrencia.
 *
 * La secuencia arranca después del mayor número ya usado con el formato
 * O-AA-NNNNNNN, para no repetir códigos existentes.
 */
export class SecuenciaCodigoObra1788500000000 implements MigrationInterface {
  name = 'SecuenciaCodigoObra1788500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "codigo_obra_seq" START WITH 1`);
    await queryRunner.query(`
      SELECT setval(
        'codigo_obra_seq',
        GREATEST(
          1,
          COALESCE(
            (SELECT MAX(CAST(substring("codigo_obra" FROM 6) AS bigint))
               FROM "grupos_reportes"
              WHERE "codigo_obra" ~ '^O-[0-9]{2}-[0-9]{7}$'),
            0
          )
        ),
        EXISTS (SELECT 1 FROM "grupos_reportes" WHERE "codigo_obra" ~ '^O-[0-9]{2}-[0-9]{7}$')
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "codigo_obra_seq"`);
  }
}
