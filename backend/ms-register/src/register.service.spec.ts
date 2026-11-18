import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import * as h3 from 'h3-js';
import { Reporte, Dispositivo, Categoria } from '@ojo-camba/common';
import { RegisterService } from './register.service';

const IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Ray-casting point-in-polygon: confirma que (lat, lng) cae dentro del
// poligono devuelto por h3.cellToBoundary para la celda calculada.
function pointInPolygon(lat: number, lng: number, boundary: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = boundary.length - 1; i < boundary.length; j = i++) {
    const [latI, lngI] = boundary[i];
    const [latJ, lngJ] = boundary[j];
    const intersects =
      latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (intersects) inside = !inside;
  }
  return inside;
}

describe('H3 precision (ISSUE-19)', () => {
  const puntos: [number, number][] = [
    [-17.7833, -63.1822], // Santa Cruz de la Sierra, centro
    [-17.8, -63.2],
    [-17.75, -63.15],
  ];

  it.each(puntos)(
    'res 8/11/13 generan celdas validas que contienen el punto (%d, %d)',
    (lat, lng) => {
      for (const res of [8, 11, 13]) {
        const cell = h3.latLngToCell(lat, lng, res);
        expect(h3.isValidCell(cell)).toBe(true);

        const boundary = h3.cellToBoundary(cell);
        expect(pointInPolygon(lat, lng, boundary)).toBe(true);
      }
    },
  );

  it('resoluciones mas finas producen celdas mas pequenas (8 > 11 > 13 en area)', () => {
    const [lat, lng] = puntos[0];
    const cell8 = h3.latLngToCell(lat, lng, 8);
    const cell11 = h3.latLngToCell(lat, lng, 11);
    const cell13 = h3.latLngToCell(lat, lng, 13);

    expect(h3.cellArea(cell8, 'km2')).toBeGreaterThan(h3.cellArea(cell11, 'km2'));
    expect(h3.cellArea(cell11, 'km2')).toBeGreaterThan(h3.cellArea(cell13, 'km2'));
  });
});

describe('RegisterService.create', () => {
  let service: RegisterService;
  let reporteRepo: Record<string, jest.Mock>;
  let categoriaRepo: Record<string, jest.Mock>;
  let dispositivoRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);

    reporteRepo = {
      create: jest.fn((x) => ({ id: 1, creado_en: new Date(), estado: 'Reportado', ...x })),
      save: jest.fn((x) => Promise.resolve(x)),
      count: jest.fn().mockResolvedValue(0),
    };
    categoriaRepo = {
      findOne: jest.fn().mockResolvedValue({ id: 1, nombre: 'bache' }),
    };
    dispositivoRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterService,
        { provide: getRepositoryToken(Reporte), useValue: reporteRepo },
        { provide: getRepositoryToken(Dispositivo), useValue: dispositivoRepo },
        { provide: getRepositoryToken(Categoria), useValue: categoriaRepo },
      ],
    }).compile();

    service = module.get(RegisterService);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('validaciones del reporte (issue #3)', () => {
    const base = { device_id: 'd1', lat: -17.78, lng: -63.18, categoria_id: 1, imagen_base64: IMG };
    const JPEG =
      'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]).toString('base64');

    it('rechaza una ubicación fuera de Santa Cruz', async () => {
      await expect(service.create({ ...base, lat: -16.5, lng: -68.15 })).rejects.toThrow(
        'fuera del área de Santa Cruz',
      );
    });

    it('rechaza coordenadas que no son números', async () => {
      await expect(service.create({ ...base, lat: 'abc' as unknown as number })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rechaza una gravedad que no existe', async () => {
      await expect(service.create({ ...base, gravedad: 'Catastrofica' })).rejects.toThrow(
        'Gravedad inválida',
      );
    });

    it('limita los reportes por dispositivo por hora con 429', async () => {
      reporteRepo.count.mockResolvedValue(10);
      await expect(service.create(base)).rejects.toMatchObject({ status: 429 });
      expect(reporteRepo.save).not.toHaveBeenCalled();
    });

    it('rechaza un archivo que dice ser imagen pero no lo es', async () => {
      const falso =
        'data:image/png;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64');
      await expect(service.create({ ...base, imagen_base64: falso })).rejects.toThrow(
        'no es una imagen',
      );
    });

    it('rechaza una imagen de más de 5 MB', async () => {
      const grande = Buffer.alloc(5 * 1024 * 1024 + 1);
      grande.set([0xff, 0xd8, 0xff]);
      await expect(
        service.create({
          ...base,
          imagen_base64: 'data:image/jpeg;base64,' + grande.toString('base64'),
        }),
      ).rejects.toThrow('máximo es 5 MB');
    });

    it('decide la extensión por los bytes reales del archivo', async () => {
      const s3 = jest.spyOn(S3Client.prototype, 'send');
      // Declarada como PNG, pero los bytes son de un JPEG.
      await service.create({ ...base, imagen_base64: JPEG.replace('image/jpeg', 'image/png') });
      const comando = s3.mock.calls.at(-1)?.[0] as unknown as {
        input: { Key: string; ContentType: string };
      };
      expect(comando.input.Key).toMatch(/.jpg$/);
      expect(comando.input.ContentType).toBe('image/jpeg');
    });
  });

  it('rechaza reportes de un dispositivo baneado sin subir la foto', async () => {
    dispositivoRepo.findOne.mockResolvedValue({ device_id: 'd1', is_banned: true });
    const s3Send = jest.spyOn(S3Client.prototype, 'send');
    await expect(
      service.create({
        device_id: 'd1',
        lat: -17.78,
        lng: -63.18,
        categoria_id: 1,
        imagen_base64: IMG,
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(s3Send).not.toHaveBeenCalled();
    expect(reporteRepo.save).not.toHaveBeenCalled();
  });

  it('acepta reportes de un dispositivo conocido que no está baneado', async () => {
    dispositivoRepo.findOne.mockResolvedValue({ device_id: 'd1', is_banned: false });
    await expect(
      service.create({
        device_id: 'd1',
        lat: -17.78,
        lng: -63.18,
        categoria_id: 1,
        imagen_base64: IMG,
      }),
    ).resolves.toEqual(expect.objectContaining({ estado: 'Reportado' }));
  });

  it('rechaza categoria inexistente', async () => {
    categoriaRepo.findOne.mockResolvedValue(null);
    await expect(
      service.create({
        device_id: 'd1',
        lat: -17.78,
        lng: -63.18,
        categoria_id: 99,
        imagen_base64: IMG,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza imagen con formato base64 invalido', async () => {
    await expect(
      service.create({
        device_id: 'd1',
        lat: -17.78,
        lng: -63.18,
        categoria_id: 1,
        imagen_base64: 'no-es-base64',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rechaza si no se envia imagen', async () => {
    await expect(
      service.create({ device_id: 'd1', lat: -17.78, lng: -63.18, categoria_id: 1 }),
    ).rejects.toThrow('Se requiere imagen en base64');
  });

  it('crea el reporte con los 3 indices H3 y estado inicial Reportado', async () => {
    const result = await service.create({
      device_id: 'd1',
      lat: -17.7833,
      lng: -63.1822,
      categoria_id: 1,
      imagen_base64: IMG,
    });

    expect(result.h3_res_8).toBe(h3.latLngToCell(-17.7833, -63.1822, 8));
    expect(result.h3_res_11).toBe(h3.latLngToCell(-17.7833, -63.1822, 11));
    expect(result.h3_res_13).toBe(h3.latLngToCell(-17.7833, -63.1822, 13));
    expect(result.estado).toBe('Reportado');
    expect(dispositivoRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ device_id: 'd1' }),
      ['device_id'],
    );
  });
});
