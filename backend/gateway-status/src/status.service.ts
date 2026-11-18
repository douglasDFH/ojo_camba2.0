import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { LessThan, Repository } from 'typeorm';
import { firstValueFrom, timeout } from 'rxjs';
import { TCP_PATTERNS, PingLog } from '@ojo-camba/common';

export interface ServiceStatus {
  name: string;
  status: 'ok' | 'down';
  latencyMs?: number;
}

export interface StatusResult {
  status: 'ok' | 'degraded';
  services: ServiceStatus[];
  timestamp: string;
}

export interface DayUptime {
  fecha: string;
  uptimePct: number;
  totalChecks: number;
}

export interface ServiceHistory {
  servicio: string;
  dias: DayUptime[];
}

const DIAS_HISTORIAL_DEFAULT = 30;
const DIAS_HISTORIAL_MAX = 90;

/**
 * Días de ping_log que se conservan (PING_LOG_RETENCION_DIAS). Nunca menos que
 * el historial que muestra la App Status, para no vaciarle sus barras de uptime.
 */
export function diasRetencionPingLog(env: NodeJS.ProcessEnv = process.env): number {
  const valor = parseInt(env.PING_LOG_RETENCION_DIAS ?? '', 10);
  return Number.isInteger(valor) && valor > DIAS_HISTORIAL_MAX ? valor : DIAS_HISTORIAL_MAX;
}

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);
  private cached: StatusResult;

  constructor(
    @Inject('MS_AUTH') private readonly authClient: ClientProxy,
    @Inject('MS_REGISTER') private readonly registerClient: ClientProxy,
    @Inject('MS_ADMIN') private readonly adminClient: ClientProxy,
    @Inject('MS_GAMIFY') private readonly gamifyClient: ClientProxy,
    @Inject('MS_IA') private readonly iaClient: ClientProxy,
    @InjectRepository(PingLog) private readonly pingLogRepo: Repository<PingLog>,
  ) {
    this.pingAll();
  }

  @Interval(60000)
  private autoPing() {
    this.pingAll();
  }

  /**
   * Cada ping agrega una fila por servicio cada minuto y nada las borraba: la
   * tabla crecía sin límite. Cada 6 horas se borra lo que pasó la retención.
   */
  @Interval(6 * 60 * 60 * 1000)
  async purgarHistorialAntiguo(ahora = new Date()): Promise<number> {
    const limite = new Date(ahora.getTime() - diasRetencionPingLog() * 24 * 60 * 60 * 1000);
    try {
      const resultado = await this.pingLogRepo.delete({ creado_en: LessThan(limite) });
      const borradas = resultado.affected ?? 0;
      if (borradas > 0)
        this.logger.log(
          `ping_log: ${borradas} filas anteriores a ${limite.toISOString()} borradas`,
        );
      return borradas;
    } catch (err) {
      this.logger.warn(`No se pudo purgar ping_log: ${(err as Error).message}`);
      return 0;
    }
  }

  getStatus(): StatusResult {
    return this.cached;
  }

  private async pingAll() {
    const services = [
      { name: 'ms-auth', client: this.authClient, pattern: TCP_PATTERNS.AUTH.PING },
      { name: 'ms-register', client: this.registerClient, pattern: TCP_PATTERNS.REGISTER.PING },
      { name: 'ms-admin', client: this.adminClient, pattern: TCP_PATTERNS.ADMIN.PING },
      { name: 'ms-gamify', client: this.gamifyClient, pattern: TCP_PATTERNS.GAMIFY.PING },
      { name: 'ms-ia', client: this.iaClient, pattern: TCP_PATTERNS.IA.PING },
    ];

    const results = await Promise.allSettled(
      services.map(async (s) => {
        const start = Date.now();
        await firstValueFrom(s.client.send(s.pattern, {}).pipe(timeout(3000)));
        return Date.now() - start;
      }),
    );

    const statuses: ServiceStatus[] = services.map((s, i) => {
      const result = results[i];
      return {
        name: s.name,
        status: result.status === 'fulfilled' ? 'ok' : 'down',
        latencyMs: result.status === 'fulfilled' ? result.value : undefined,
      };
    });

    const allOk = statuses.every((s) => s.status === 'ok');

    this.cached = {
      status: allOk ? 'ok' : 'degraded',
      services: statuses,
      timestamp: new Date().toISOString(),
    };

    try {
      await this.pingLogRepo.insert(
        statuses.map((s) => ({
          servicio: s.name,
          estado: s.status,
          latencia_ms: s.latencyMs ?? null,
        })),
      );
    } catch (err) {
      this.logger.warn(`No se pudo persistir el historial de ping: ${(err as Error).message}`);
    }
  }

  async getHistory(days = DIAS_HISTORIAL_DEFAULT): Promise<ServiceHistory[]> {
    const clamped = Math.min(Math.max(days, 1), DIAS_HISTORIAL_MAX);
    const since = new Date();
    since.setDate(since.getDate() - clamped);
    since.setHours(0, 0, 0, 0);

    const rows = await this.pingLogRepo
      .createQueryBuilder('p')
      .select('p.servicio', 'servicio')
      .addSelect("date_trunc('day', p.creado_en)", 'dia')
      .addSelect("COUNT(*) FILTER (WHERE p.estado = 'ok')", 'ok_count')
      .addSelect('COUNT(*)', 'total_count')
      .where('p.creado_en >= :since', { since })
      .groupBy('p.servicio')
      .addGroupBy('dia')
      .orderBy('p.servicio')
      .addOrderBy('dia')
      .getRawMany<{ servicio: string; dia: Date; ok_count: string; total_count: string }>();

    const bySvc = new Map<string, DayUptime[]>();
    for (const row of rows) {
      const list = bySvc.get(row.servicio) ?? [];
      list.push({
        fecha: new Date(row.dia).toISOString().slice(0, 10),
        uptimePct: Math.round((Number(row.ok_count) / Number(row.total_count)) * 1000) / 10,
        totalChecks: Number(row.total_count),
      });
      bySvc.set(row.servicio, list);
    }

    return Array.from(bySvc.entries()).map(([servicio, dias]) => ({ servicio, dias }));
  }
}
