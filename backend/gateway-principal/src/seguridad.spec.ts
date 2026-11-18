import 'reflect-metadata';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { ROLES, TCP_PATTERNS } from '@ojo-camba/common';
import { of } from 'rxjs';
import { AdminController } from './admin.controller';
import { AuthController } from './auth.controller';
import { GamifyController } from './gamify.controller';
import { IaController } from './ia.controller';
import { AiConfigurationController } from './ai-configuration.controller';
import { AsistenteController } from './asistente.controller';
import { ReportesController } from './reportes.controller';
import { EventsGateway } from './events/events.gateway';
import {
  exigirPropioOGestion,
  OptionalAuthGuard,
  ROLES_GESTION,
  ROLES_REQUERIDOS,
  TokenValidation,
} from './roles.guard';

/**
 * Bloque 1 de la auditoría (issue #1): ninguna ruta que modifica datos o
 * devuelve datos internos puede responder sin token.
 *
 * La lista de rutas públicas es explícita a propósito: si alguien agrega una
 * ruta nueva sin guard, esta prueba falla hasta que se decida si es pública.
 */

type Controlador = { prototype: object; name: string };

const PUBLICAS: Record<string, string[]> = {
  // Transparencia ciudadana: mapa de casos, ficha pública, línea de tiempo y fotos.
  AdminController: [
    'getUpdateImagen',
    'getGroupsHeatmap',
    'listGroupsByCell',
    'getGroup',
    'getTimeline',
  ],
  AuthController: ['register', 'login', 'refresh', 'validate'],
  GamifyController: ['levels'],
  // `create` usa autenticación opcional (reporte anónimo); se verifica abajo.
  ReportesController: ['list', 'heatmap', 'heatmapDetailed', 'get', 'getImagen'],
};

const rutas = (c: Controlador): string[] =>
  Object.getOwnPropertyNames(c.prototype).filter(
    (m) =>
      m !== 'constructor' && Reflect.getMetadata('method', (c.prototype as never)[m]) !== undefined,
  );

const tieneGuard = (c: Controlador, metodo: string): boolean =>
  ((Reflect.getMetadata(GUARDS_METADATA, (c.prototype as never)[metodo]) as unknown[]) ?? [])
    .length > 0;

describe('Rutas del gateway sin autenticación', () => {
  const controladores: Controlador[] = [
    AdminController,
    AuthController,
    GamifyController,
    ReportesController,
  ];

  it.each(controladores.map((c) => [c.name, c] as const))(
    '%s: solo las rutas públicas declaradas quedan sin guard',
    (nombre, controlador) => {
      const sinGuard = rutas(controlador).filter((m) => !tieneGuard(controlador, m));
      expect(sinGuard.sort()).toEqual([...(PUBLICAS[nombre] ?? [])].sort());
    },
  );

  it('el listado de usuarios es solo para el encargado de IT (issue #3)', () => {
    const roles = Reflect.getMetadata(
      ROLES_REQUERIDOS,
      AuthController.prototype.listUsers,
    ) as string[];
    expect(tieneGuard(AuthController, 'listUsers')).toBe(true);
    expect(roles).toEqual([ROLES.ENCARGADO_IT]);
  });

  it('ya no existe la ruta para regalar puntos', () => {
    expect(rutas(GamifyController)).not.toContain('award');
  });
});

describe('OptionalAuthGuard', () => {
  const contexto = (headers: Record<string, string>) => {
    const request: { headers: Record<string, string>; user?: TokenValidation } = { headers };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { ctx, request };
  };
  const guard = (validacion: Partial<TokenValidation>) =>
    new OptionalAuthGuard({
      send: jest.fn().mockReturnValue(of({ valid: true, user_id: 7, roles: [], ...validacion })),
    } as unknown as ClientProxy);

  it('deja pasar sin cabecera como anónimo', async () => {
    const { ctx, request } = contexto({});
    await expect(guard({}).canActivate(ctx)).resolves.toBe(true);
    expect(request.user).toBeUndefined();
  });

  it('con token válido identifica al usuario', async () => {
    const { ctx, request } = contexto({ authorization: 'Bearer abc' });
    await guard({}).canActivate(ctx);
    expect(request.user?.user_id).toBe(7);
  });

  it('con token inválido rechaza en vez de tratarlo como anónimo', async () => {
    const { ctx } = contexto({ authorization: 'Bearer malo' });
    await expect(guard({ valid: false, user_id: null }).canActivate(ctx)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('exigirPropioOGestion', () => {
  const user = (roles: string[]): TokenValidation => ({ valid: true, user_id: 7, roles });

  it('el ciudadano lee sus propios datos', () => {
    expect(() => exigirPropioOGestion(user([ROLES.CIUDADANO]), 7)).not.toThrow();
  });

  it('el ciudadano no lee datos de otro', () => {
    expect(() => exigirPropioOGestion(user([ROLES.CIUDADANO]), 8)).toThrow(ForbiddenException);
  });

  it('un rol de gestión puede leer datos de otro usuario', () => {
    expect(() => exigirPropioOGestion(user([ROLES.ENCARGADO_IT]), 8)).not.toThrow();
  });
});

describe('La identidad sale del token, no del cuerpo', () => {
  const sesion = { user: { valid: true, user_id: 7, roles: [ROLES.COORDINADOR_OPERATIVO] } };

  it('POST /reportes ignora un usuario_id falso en el cuerpo', async () => {
    const send = jest.fn().mockReturnValue(of({ id: 1 }));
    const events = { emitNewReport: jest.fn() } as unknown as EventsGateway;
    const controlador = new ReportesController({ send } as unknown as ClientProxy, events);

    const cuerpo = {
      device_id: 'd1',
      lat: -17.78,
      lng: -63.18,
      categoria_id: 1,
      imagen_base64: 'data:image/png;base64,AA==',
      usuario_id: 999,
    };
    await controlador.create(sesion, cuerpo);

    expect(send).toHaveBeenCalledWith(
      TCP_PATTERNS.REGISTER.CREATE_REPORT,
      expect.objectContaining({ usuario_id: 7 }),
    );
  });

  it('POST /reportes sin sesión crea un reporte anónimo', async () => {
    const send = jest.fn().mockReturnValue(of({ id: 1 }));
    const events = { emitNewReport: jest.fn() } as unknown as EventsGateway;
    const controlador = new ReportesController({ send } as unknown as ClientProxy, events);

    await controlador.create({}, { device_id: 'd1', lat: -17.78, lng: -63.18, categoria_id: 1 });

    expect(send.mock.calls[0][1].usuario_id).toBeUndefined();
  });

  it('la bitácora del caso se firma con el usuario del token', async () => {
    const send = jest.fn().mockReturnValue(of({ id: 1 }));
    const controlador = new AdminController(
      { send } as unknown as ClientProxy,
      {} as unknown as EventsGateway,
    );

    await controlador.updateCase(sesion, '5', {
      comentario: 'avance',
      usuario_id: 999,
    } as never);

    expect(send).toHaveBeenCalledWith(
      TCP_PATTERNS.ADMIN.UPDATE_CASE,
      expect.objectContaining({ grupo_id: 5, usuario_id: 7 }),
    );
  });

  it('logout cierra la sesión del dueño del token', async () => {
    const send = jest.fn().mockReturnValue(of({ ok: true }));
    const controlador = new AuthController({ send } as unknown as ClientProxy);

    await controlador.logout(sesion);

    expect(send).toHaveBeenCalledWith(TCP_PATTERNS.AUTH.LOGOUT, { user_id: 7 });
  });
});

describe('Rutas de IA: el rol coincide con la pantalla que las usa', () => {
  const rolesDeRuta = (controlador: Controlador, metodo: string): string[] =>
    (Reflect.getMetadata(ROLES_REQUERIDOS, (controlador.prototype as never)[metodo]) as string[]) ??
    (Reflect.getMetadata(ROLES_REQUERIDOS, controlador) as string[]);

  it('triaje y análisis de foto son de la bandeja de moderación', () => {
    expect(rolesDeRuta(IaController, 'inferirTriaje')).toEqual([ROLES.BACKOFFICE]);
    expect(rolesDeRuta(IaController, 'sugerirHechos')).toEqual([ROLES.BACKOFFICE]);
  });

  it('la recomendación de cuadrilla es del coordinador operativo', () => {
    expect(rolesDeRuta(IaController, 'recomendarCuadrilla')).toEqual([ROLES.COORDINADOR_OPERATIVO]);
  });

  it('la configuración de proveedores es solo del encargado de IT', () => {
    expect(rolesDeRuta(AiConfigurationController, 'listProviders')).toEqual([ROLES.ENCARGADO_IT]);
  });

  it('el asistente está disponible para todos los roles de gestión', () => {
    expect(rolesDeRuta(AsistenteController, 'chat')).toEqual(ROLES_GESTION);
  });
});
