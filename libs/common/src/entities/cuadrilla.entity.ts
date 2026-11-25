import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  Unique,
  type Relation,
} from 'typeorm';
import type { Especialidad } from './especialidad.entity';

/**
 * Equipo de campo que ejecuta los Casos de Obra. Una cuadrilla tiene una sola
 * especialidad; `activa=false` la saca de las asignaciones nuevas sin borrar el
 * historial de los casos que ya atendió.
 */
@Entity('cuadrillas')
@Unique(['nombre'])
export class Cuadrilla {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'int', nullable: true })
  especialidad_id: number | null;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  /** Base opcional usada por el motor cuando el responsable no comparte GPS. */
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat_base: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng_base: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @ManyToOne('Especialidad', { onDelete: 'SET NULL' })
  @JoinColumn({
    name: 'especialidad_id',
    foreignKeyConstraintName: 'FK_cuadrillas_especialidad_id',
  })
  especialidad?: Relation<Especialidad>;
}
