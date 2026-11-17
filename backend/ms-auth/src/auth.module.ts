import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GestionAccesosService } from './gestion-accesos.service';
import {
  Cuadrilla,
  CuadrillaMiembro,
  RefreshToken,
  Rol,
  SolicitudTi,
  SolicitudTiUsuario,
  Usuario,
  UsuarioRol,
} from '@ojo-camba/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      Rol,
      UsuarioRol,
      RefreshToken,
      SolicitudTi,
      SolicitudTiUsuario,
      Cuadrilla,
      CuadrillaMiembro,
    ]),
    // registerAsync: el secreto se lee al arrancar, cuando ConfigModule ya cargó
    // el .env. Sin secreto el servicio no arranca: un valor por defecto en un
    // repositorio público permitiría a cualquiera firmar tokens válidos.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: exigirJwtSecret(),
        signOptions: { expiresIn: '7d' as const },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, GestionAccesosService],
})
export class AuthModule {}

const SECRETOS_DE_EJEMPLO = ['dev_jwt_secret_change_in_prod', 'change_me_in_production'];

export function exigirJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secreto = env.JWT_SECRET?.trim();
  if (!secreto) {
    throw new Error('JWT_SECRET no está definido: ms-auth no puede firmar tokens.');
  }
  if (env.NODE_ENV === 'production' && SECRETOS_DE_EJEMPLO.includes(secreto)) {
    throw new Error('JWT_SECRET usa un valor de ejemplo; genera uno propio para producción.');
  }
  return secreto;
}
