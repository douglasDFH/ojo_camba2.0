import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientProxy } from '@nestjs/microservices';
import { ROLES, tieneAlgunRol, TCP_PATTERNS } from '@ojo-camba/common';
import { firstValueFrom } from 'rxjs';

export const ROLES_REQUERIDOS = 'roles_requeridos';
export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_REQUERIDOS, roles);

export interface TokenValidation {
  valid: boolean;
  user_id: number | null;
  email?: string | null;
  roles: string[];
}

/** Punto único de autorización HTTP. Los TCP internos reciben el actor validado. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('MS_AUTH') private readonly auth: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string }; user?: TokenValidation }>();
    const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Se requiere un token de acceso.');

    const validation = await firstValueFrom(
      this.auth.send<TokenValidation>(TCP_PATTERNS.AUTH.VALIDATE_TOKEN, { token }),
    );
    if (!validation.valid || validation.user_id == null) {
      throw new UnauthorizedException('Token de acceso inválido o expirado.');
    }

    const requeridos = this.reflector.getAllAndOverride<string[]>(ROLES_REQUERIDOS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requeridos?.length && !tieneAlgunRol(validation.roles, requeridos)) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }
    request.user = validation;
    return true;
  }
}

/** Roles de gestión municipal: cualquiera de ellos puede consultar datos internos. */
export const ROLES_GESTION = [
  ROLES.BACKOFFICE,
  ROLES.COORDINADOR_OPERATIVO,
  ROLES.ENCARGADO_IT,
  ROLES.AUTORIDAD_MUNICIPAL,
];

/**
 * Autenticación opcional: sin cabecera Authorization deja pasar como anónimo
 * (`request.user` queda sin definir); con cabecera exige que el token sea válido.
 * Sirve para rutas que aceptan ciudadanos anónimos pero deben tomar la
 * identidad del token cuando existe, nunca del cuerpo de la petición.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(@Inject('MS_AUTH') private readonly auth: ClientProxy) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string }; user?: TokenValidation }>();
    const header = request.headers.authorization;
    if (!header) return true;

    const token = header.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) throw new UnauthorizedException('Cabecera Authorization mal formada.');
    const validation = await firstValueFrom(
      this.auth.send<TokenValidation>(TCP_PATTERNS.AUTH.VALIDATE_TOKEN, { token }),
    );
    if (!validation.valid || validation.user_id == null) {
      throw new UnauthorizedException('Token de acceso inválido o expirado.');
    }
    request.user = validation;
    return true;
  }
}

/** El usuario solo puede leer sus propios datos, salvo que tenga un rol de gestión. */
export function exigirPropioOGestion(user: TokenValidation, usuarioId: number): void {
  if (user.user_id === usuarioId) return;
  if (tieneAlgunRol(user.roles, ROLES_GESTION)) return;
  throw new ForbiddenException('Solo puedes consultar tus propios datos.');
}
