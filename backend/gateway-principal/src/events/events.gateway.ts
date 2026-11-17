import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ROLES, tieneAlgunRol, TCP_PATTERNS } from '@ojo-camba/common';
import { firstValueFrom } from 'rxjs';
import { Server, Socket } from 'socket.io';

/** Sala con los sockets ya autenticados; los eventos internos solo van ahí. */
export const SALA_MODERACION = 'moderacion';

/** Quién puede escuchar la bandeja en tiempo real. */
const ROLES_SOCKET = [
  ROLES.BACKOFFICE,
  ROLES.COORDINADOR_OPERATIVO,
  ROLES.ENCARGADO_IT,
  ROLES.AUTORIDAD_MUNICIPAL,
];

interface UsuarioSocket {
  user_id: number;
  roles: string[];
}

/** TTL de un claim: si no llega heartbeat en 60s, se libera. */
export const CLAIM_TTL_MS = 60_000;
const SWEEP_INTERVAL_MS = 10_000;

interface Claim {
  reportId: number;
  moderadorId: number;
  nombre: string;
  socketId: string;
  /** epoch ms del último heartbeat/claim. */
  lastSeen: number;
}

export interface ClaimInfo {
  reportId: number;
  moderadorId: number;
  nombre: string;
}

/**
 * EventsGateway — tiempo real para el backoffice (ISSUE-23 / CU moderación).
 *
 * - Difunde reportes nuevos y resueltos sin recargar.
 * - Sistema de "claim": un moderador toma un reporte y los demás lo ven
 *   bloqueado. El claim se libera al soltar, al resolver, por desconexión
 *   o por expiración de TTL (60s sin heartbeat).
 */
// Comparte el mismo puerto HTTP de Fastify (:PORT) y el mismo CORS_ORIGIN que
// app.enableCors() en main.ts. El cliente ya fuerza transports: ['websocket']
// (ver frontend/app-backoffice/src/lib/socket.ts), asi que nunca hace el
// handshake por polling que chocaba con el router de Fastify.
@WebSocketGateway({
  cors: { origin: (process.env.CORS_ORIGIN ?? '*').split(',') },
  transports: ['websocket'],
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);
  private readonly claims = new Map<number, Claim>();
  private sweepTimer?: ReturnType<typeof setInterval>;

  constructor(@Inject('MS_AUTH') private readonly auth: ClientProxy) {}

  afterInit() {
    this.sweepTimer = setInterval(() => this.sweepExpired(), SWEEP_INTERVAL_MS);
    this.logger.log('EventsGateway inicializado');
  }

  /**
   * El cliente manda su token en el handshake (`auth: { token }`). Sin token
   * válido, o sin un rol de gestión, se desconecta: la bandeja trae datos de
   * reportes que no son públicos.
   */
  async handleConnection(client: Socket) {
    const token = (client.handshake.auth as { token?: unknown } | undefined)?.token;
    const usuario = typeof token === 'string' && token ? await this.validar(token) : null;
    if (!usuario) {
      client.emit('auth:error', { message: 'Se requiere una sesión válida de gestión.' });
      client.disconnect(true);
      return;
    }
    client.data.usuario = usuario;
    await client.join(SALA_MODERACION);
    // Estado inicial: enviar los claims activos al cliente que se conecta.
    client.emit('claims:snapshot', this.activeClaims());
  }

  handleDisconnect(client: Socket) {
    // Auto-release: liberar todos los claims que tenía este socket.
    for (const [reportId, claim] of this.claims) {
      if (claim.socketId === client.id) {
        this.claims.delete(reportId);
        this.sala().emit('report:released', { reportId });
      }
    }
  }

  @SubscribeMessage('report:claim')
  handleClaim(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { reportId: number; nombre: string },
  ) {
    const usuario = this.usuarioDe(client);
    if (!usuario) return;
    // El moderador es quien firmó el token, no un id que manda el cliente.
    const moderadorId = usuario.user_id;
    const existing = this.claims.get(data.reportId);
    if (existing && existing.moderadorId !== moderadorId && !this.isExpired(existing)) {
      // Ya está tomado por otro moderador.
      client.emit('report:claim_denied', { reportId: data.reportId, nombre: existing.nombre });
      return;
    }
    this.claims.set(data.reportId, {
      reportId: data.reportId,
      moderadorId,
      nombre: data.nombre,
      socketId: client.id,
      lastSeen: Date.now(),
    });
    this.sala().emit('report:claimed', {
      reportId: data.reportId,
      moderadorId,
      nombre: data.nombre,
    });
  }

  @SubscribeMessage('report:release')
  handleRelease(@ConnectedSocket() client: Socket, @MessageBody() data: { reportId: number }) {
    const existing = this.claims.get(data.reportId);
    if (existing && existing.socketId === client.id) {
      this.claims.delete(data.reportId);
      this.sala().emit('report:released', { reportId: data.reportId });
    }
  }

  @SubscribeMessage('report:heartbeat')
  handleHeartbeat(@ConnectedSocket() client: Socket, @MessageBody() data: { reportId: number }) {
    const existing = this.claims.get(data.reportId);
    if (existing && existing.socketId === client.id) {
      existing.lastSeen = Date.now();
    }
  }

  // ── API pública (la usan los controllers) ──────────────────────────────

  /** Notifica un reporte recién creado a todas las bandejas. */
  emitNewReport(report: unknown) {
    this.sala()?.emit('report:new', report);
  }

  /** Reporte aceptado/rechazado: liberar su claim y sacarlo de las bandejas. */
  emitReportResolved(reportId: number) {
    if (this.claims.delete(reportId)) {
      this.sala()?.emit('report:released', { reportId });
    }
    this.sala()?.emit('report:resolved', { reportId });
  }

  /** Actualiza los contadores del dashboard en tiempo real. */
  emitStatsUpdate(stats: unknown) {
    this.sala()?.emit('stats:update', stats);
  }

  // ── Internos ───────────────────────────────────────────────────────────

  private sala() {
    return this.server?.to(SALA_MODERACION);
  }

  private usuarioDe(client: Socket): UsuarioSocket | null {
    return (client.data?.usuario as UsuarioSocket | undefined) ?? null;
  }

  private async validar(token: string): Promise<UsuarioSocket | null> {
    try {
      const v = await firstValueFrom(
        this.auth.send<{ valid: boolean; user_id: number | null; roles: string[] }>(
          TCP_PATTERNS.AUTH.VALIDATE_TOKEN,
          { token },
        ),
      );
      if (!v.valid || v.user_id == null || !tieneAlgunRol(v.roles, ROLES_SOCKET)) return null;
      return { user_id: v.user_id, roles: v.roles };
    } catch (err) {
      this.logger.warn(`No se pudo validar el token del socket: ${(err as Error).message}`);
      return null;
    }
  }

  private isExpired(claim: Claim): boolean {
    return Date.now() - claim.lastSeen > CLAIM_TTL_MS;
  }

  private sweepExpired() {
    for (const [reportId, claim] of this.claims) {
      if (this.isExpired(claim)) {
        this.claims.delete(reportId);
        this.sala().emit('report:released', { reportId });
      }
    }
  }

  private activeClaims(): ClaimInfo[] {
    return Array.from(this.claims.values())
      .filter((c) => !this.isExpired(c))
      .map(({ reportId, moderadorId, nombre }) => ({ reportId, moderadorId, nombre }));
  }
}
