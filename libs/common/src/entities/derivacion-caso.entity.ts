import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import type { GrupoReporte } from './grupo-reporte.entity';

/** Evidencia auditable de una derivación confirmada en campo. */
@Entity('derivaciones_caso')
@Index('IDX_derivaciones_caso_grupo_creado', ['grupo_id', 'creado_en'])
export class DerivacionCaso {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  grupo_id: number;

  @Column({ type: 'varchar', length: 160 })
  entidad_destino: string;

  @Column({ type: 'text' })
  motivo: string;

  @Column({ type: 'varchar', length: 500 })
  evidencia_url: string;

  @Column({ type: 'int' })
  confirmado_por_usuario_id: number;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @ManyToOne('GrupoReporte', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'grupo_id', foreignKeyConstraintName: 'FK_derivaciones_caso_grupo_id' })
  grupo?: Relation<GrupoReporte>;
}
