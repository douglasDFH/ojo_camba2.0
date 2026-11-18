import { of, throwError } from 'rxjs';
import { diasRetencionPingLog, StatusService } from './status.service';

function makeClient(behavior: 'ok' | 'down') {
  return {
    send: jest.fn(() =>
      behavior === 'ok' ? of({ status: 'ok' }) : throwError(() => new Error('timeout')),
    ),
  };
}

function makePingLogRepo() {
  return { insert: jest.fn().mockResolvedValue(undefined) };
}

function makeHistoryRepo(rawRows: Record<string, unknown>[]) {
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(rawRows),
  };
  return { createQueryBuilder: jest.fn(() => qb) };
}

describe('StatusService — retención de ping_log (issue #4)', () => {
  const crear = (repo: unknown) =>
    new StatusService(
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      repo as never,
    );

  it('borra solo lo anterior a 90 días, el máximo del historial de la App Status', async () => {
    const repo = { ...makePingLogRepo(), delete: jest.fn().mockResolvedValue({ affected: 42 }) };
    const ahora = new Date('2026-11-17T12:00:00Z');

    await expect(crear(repo).purgarHistorialAntiguo(ahora)).resolves.toBe(42);

    const limite = (repo.delete.mock.calls[0][0] as { creado_en: { value: Date } }).creado_en.value;
    expect(limite.toISOString()).toBe('2026-08-19T12:00:00.000Z');
  });

  it('nunca retiene menos que el historial visible, aunque se configure menos', () => {
    expect(diasRetencionPingLog({ PING_LOG_RETENCION_DIAS: '7' })).toBe(90);
    expect(diasRetencionPingLog({ PING_LOG_RETENCION_DIAS: '180' })).toBe(180);
  });

  it('un fallo al purgar no tumba el servicio', async () => {
    const repo = {
      ...makePingLogRepo(),
      delete: jest.fn().mockRejectedValue(new Error('db caida')),
    };
    await expect(crear(repo).purgarHistorialAntiguo()).resolves.toBe(0);
  });
});

describe('StatusService — agregacion de ping (ISSUE-20)', () => {
  it('reporta status global "ok" cuando los 5 microservicios responden', async () => {
    const service = new StatusService(
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makePingLogRepo() as never,
    );

    await (service as unknown as { pingAll: () => Promise<void> }).pingAll();
    const result = service.getStatus();

    expect(result.status).toBe('ok');
    expect(result.services.every((s) => s.status === 'ok')).toBe(true);
    expect(result.services).toHaveLength(5);
  });

  it('marca como "Interrupcion" (down) solo el microservicio caido, sin afectar a los demas', async () => {
    const service = new StatusService(
      makeClient('down') as never, // ms-auth caido
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makePingLogRepo() as never,
    );

    await (service as unknown as { pingAll: () => Promise<void> }).pingAll();
    const result = service.getStatus();

    expect(result.status).toBe('degraded');
    const authStatus = result.services.find((s) => s.name === 'ms-auth');
    expect(authStatus?.status).toBe('down');
    expect(
      result.services.filter((s) => s.name !== 'ms-auth').every((s) => s.status === 'ok'),
    ).toBe(true);
  });

  it('incluye latencia solo para los servicios que respondieron', async () => {
    const service = new StatusService(
      makeClient('down') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makePingLogRepo() as never,
    );

    await (service as unknown as { pingAll: () => Promise<void> }).pingAll();
    const result = service.getStatus();

    const authStatus = result.services.find((s) => s.name === 'ms-auth');
    const registerStatus = result.services.find((s) => s.name === 'ms-register');
    expect(authStatus?.latencyMs).toBeUndefined();
    expect(registerStatus?.latencyMs).toBeGreaterThanOrEqual(0);
  });
});

describe('StatusService — historial de uptime (ISSUE-20)', () => {
  it('persiste un registro de ping_log por cada microservicio en cada ronda', async () => {
    const pingLogRepo = makePingLogRepo();
    const service = new StatusService(
      makeClient('ok') as never,
      makeClient('down') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      pingLogRepo as never,
    );

    await (service as unknown as { pingAll: () => Promise<void> }).pingAll();

    // el constructor ya dispara un pingAll() inicial, de ahi que se acepten 2+ llamadas
    expect(pingLogRepo.insert.mock.calls.length).toBeGreaterThanOrEqual(1);
    const lastCall = pingLogRepo.insert.mock.calls.at(-1) as [
      { servicio: string; estado: string }[],
    ];
    const rows = lastCall[0];
    expect(rows).toHaveLength(5);
    expect(rows.find((r) => r.servicio === 'ms-register')?.estado).toBe('down');
  });

  it('calcula el % de uptime diario por servicio a partir del historial agrupado', async () => {
    const rawRows = [
      { servicio: 'ms-auth', dia: new Date('2026-06-29'), ok_count: '90', total_count: '100' },
      { servicio: 'ms-auth', dia: new Date('2026-06-30'), ok_count: '100', total_count: '100' },
      { servicio: 'ms-register', dia: new Date('2026-06-30'), ok_count: '59', total_count: '60' },
    ];
    const service = new StatusService(
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeHistoryRepo(rawRows) as never,
    );

    const history = await service.getHistory(30);

    const auth = history.find((h) => h.servicio === 'ms-auth');
    expect(auth?.dias).toEqual([
      { fecha: '2026-06-29', uptimePct: 90, totalChecks: 100 },
      { fecha: '2026-06-30', uptimePct: 100, totalChecks: 100 },
    ]);

    const register = history.find((h) => h.servicio === 'ms-register');
    expect(register?.dias[0].uptimePct).toBeCloseTo(98.3, 1);
  });

  it('acota "days" entre 1 y 90 antes de consultar', async () => {
    const repo = makeHistoryRepo([]);
    const service = new StatusService(
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      makeClient('ok') as never,
      repo as never,
    );

    await service.getHistory(500);

    const qb = repo.createQueryBuilder.mock.results[0].value;
    const since = qb.where.mock.calls[0][1].since as Date;
    const daysDiff = Math.round((Date.now() - since.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBeLessThanOrEqual(91);
    expect(daysDiff).toBeGreaterThanOrEqual(89);
  });
});
