import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
  type Relation,
} from 'typeorm';
import type { Cuadrilla } from './cuadrilla.entity';
import type { Usuario } from './usuario.entity';

/** Vincula técnicos con una cuadrilla y designa, como máximo, un responsable. */
@Entity('cuadrilla_miembros')
// La pareja (cuadrilla_id, usuario_id) ya es la llave primaria: PostgreSQL
// descarta el UNIQUE duplicado de la migración, así que no se declara aparte.
@Index('UQ_cuadrilla_un_responsable', ['cuadrilla_id'], {
  unique: true,
  where: '"es_responsable" = true',
})
export class CuadrillaMiembro {
  @PrimaryColumn({ type: 'int' })
  cuadrilla_id: number;

  @PrimaryColumn({ type: 'int' })
  usuario_id: number;

  @Column({ type: 'boolean', default: false })
  es_responsable: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  creado_en: Date;

  @ManyToOne('Cuadrilla', { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'cuadrilla_id',
    foreignKeyConstraintName: 'FK_cuadrilla_miembros_cuadrilla_id',
  })
  cuadrilla?: Relation<Cuadrilla>;

  @ManyToOne('Usuario', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id', foreignKeyConstraintName: 'FK_cuadrilla_miembros_usuario_id' })
  usuario?: Relation<Usuario>;
}
