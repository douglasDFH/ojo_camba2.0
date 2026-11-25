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
import { EstadoCaso } from '../enums/estado-caso.enum';
import type { Categoria } from './categoria.entity';
import type { Cuadrilla } from './cuadrilla.entity';
import type { Usuario } from './usuario.entity';

@Entity('grupos_reportes')
@Index('IDX_grupos_reportes_estado', ['estado_actual'])
@Index('IDX_grupos_reportes_cuadrilla', ['cuadrilla_id'], { where: 'cuadrilla_id IS NOT NULL' })
export class GrupoReporte {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo_obra: string;

  @Column({ type: 'varchar', length: 50, default: EstadoCaso.PendienteAsignacion })
  estado_actual: string;

  @Column({ type: 'date', nullable: true })
  fecha_estimada_fin: string | null;

  @Column({ type: 'int' })
  creado_por_usuario_id: number;

  @Column({ type: 'int', nullable: true })
  categoria_id: number | null;

  /** Cuadrilla asignada al caso. Null mientras nadie lo asigna todavía. */
  @Column({ type: 'int', nullable: true })
  cuadrilla_id: number | null;

  /** 1 es máxima prioridad y 5 es la menor. La ruta la usa como costo operativo. */
  @Column({ type: 'smallint', default: 3 })
  prioridad: number;

  /** Trazabilidad del cierre RechazadoCampo confirmado por Coordinación. */
  @Column({ type: 'int', nullable: true })
  categoria_rechazo_campo_id: number | null;

  @Column({ type: 'int', nullable: true })
  rechazado_campo_por_usuario_id: number | null;

  @Column({ type: 'timestamptz', nullable: true })
  rechazado_campo_en: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @ManyToOne('Categoria', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoria_id', foreignKeyConstraintName: 'FK_grupos_reportes_categoria_id' })
  categoria?: Relation<Categoria>;

  @ManyToOne('Cuadrilla', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'cuadrilla_id', foreignKeyConstraintName: 'FK_grupos_reportes_cuadrilla_id' })
  cuadrilla?: Relation<Cuadrilla>;

  @ManyToOne('Usuario', { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'creado_por_usuario_id',
    foreignKeyConstraintName: 'FK_grupos_reportes_creado_por_usuario_id',
  })
  creado_por?: Relation<Usuario>;
}
