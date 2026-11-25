import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import type { Cuadrilla } from './cuadrilla.entity';
import type { GrupoReporte } from './grupo-reporte.entity';
import type { Usuario } from './usuario.entity';

/**
 * Unidad de trabajo de campo. Un Caso puede tener varias visitas históricas,
 * pero solo una permanece abierta a la vez (restricción parcial de la migración).
 */
@Entity('visitas_caso')
@Index('IDX_visitas_caso_tecnico_fecha', ['tecnico_id', 'fecha_planificada'])
@Index('IDX_visitas_caso_cuadrilla_ruta', ['cuadrilla_id', 'fecha_planificada', 'orden_ruta'])
@Index('UQ_visitas_caso_grupo_abierta', ['grupo_id'], {
  unique: true,
  where: '"cerrada_en" IS NULL',
})
export class VisitaCaso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  grupo_id: number;

  @Column({ type: 'int' })
  cuadrilla_id: number;

  @Column({ type: 'int', nullable: true })
  tecnico_id: number | null;

  @Column({ type: 'int', nullable: true })
  asignado_por_usuario_id: number | null;

  @Column({ type: 'date', nullable: true })
  fecha_planificada: string | null;

  @Column({ type: 'int', nullable: true })
  orden_ruta: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  llegada_en: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat_llegada: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng_llegada: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  cerrada_en: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  actualizado_en: Date;

  @ManyToOne('GrupoReporte', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id', foreignKeyConstraintName: 'FK_visitas_caso_grupo_id' })
  grupo?: Relation<GrupoReporte>;

  @ManyToOne('Cuadrilla', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cuadrilla_id', foreignKeyConstraintName: 'FK_visitas_caso_cuadrilla_id' })
  cuadrilla?: Relation<Cuadrilla>;

  @ManyToOne('Usuario', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tecnico_id', foreignKeyConstraintName: 'FK_visitas_caso_tecnico_id' })
  tecnico?: Relation<Usuario>;
}
