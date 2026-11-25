import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Solicitud administrativa presentada a TI para altas, cambios, bajas o
 * conformación de cuadrillas. Conserva el respaldo y al ejecutor del cambio.
 */
@Entity('solicitudes_ti')
// El índice es descendente ("creado_en" DESC) y TypeORM no sabe declararlo;
// synchronize: false hace que migration:generate no lo toque.
@Index('IDX_solicitudes_ti_creado', { synchronize: false })
export class SolicitudTi {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 40 })
  tipo: string;

  @Column({ type: 'varchar', length: 255 })
  referencia_carta: string;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @Column({ type: 'int' })
  ejecutado_por_usuario_id: number;

  @Column({ type: 'varchar', length: 30, default: 'aplicada' })
  resultado: string;

  @Column({ type: 'int', nullable: true })
  cuadrilla_id: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;
}
