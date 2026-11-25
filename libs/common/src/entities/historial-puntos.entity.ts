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
import type { Reporte } from './reporte.entity';
import type { Usuario } from './usuario.entity';

@Entity('historial_puntos')
export class HistorialPuntos {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  usuario_id: number;

  @Index({ unique: true, where: 'report_id IS NOT NULL' })
  @Column({ type: 'int', nullable: true })
  report_id: number | null;

  @Column({ type: 'int' })
  puntos: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivo: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id', foreignKeyConstraintName: 'FK_historial_puntos_usuario_id' })
  usuario?: Relation<Usuario>;

  @ManyToOne('Reporte', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'report_id', foreignKeyConstraintName: 'FK_historial_puntos_report_id' })
  reporte?: Relation<Reporte>;
}
