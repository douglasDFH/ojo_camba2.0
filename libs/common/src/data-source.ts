import 'reflect-metadata';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { ENTIDADES } from './entities/todas';

config({ path: './backend/ms-auth/.env' });

// ts-node ejecuta el .ts → __filename termina en .ts → usa fuentes TypeScript.
// tsc compila a libs/common/dist/data-source.js → __filename termina en .js → usa compilados.
const migrations = __filename.endsWith('.js')
  ? [join(__dirname, 'migrations', '*.js')]
  : [join(__dirname, 'migrations', '*.ts')];

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL ?? 'postgresql://ojocamba:ojocamba_secret@localhost:5432/ojocamba',
  synchronize: false,
  logging: ['error'],
  entities: ENTIDADES,
  migrations,
});
