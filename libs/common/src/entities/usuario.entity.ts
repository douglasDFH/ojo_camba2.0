import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import type { Nivel } from './nivel.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string | null;

  @Column({ type: 'int', default: 0 })
  puntos: number;

  @Column({ type: 'int', nullable: true })
  nivel_id: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @ManyToOne('Nivel', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'nivel_id', foreignKeyConstraintName: 'FK_usuarios_nivel_id' })
  nivel?: Relation<Nivel>;
}
