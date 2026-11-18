import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import * as h3 from 'h3-js';
import * as crypto from 'crypto';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Reporte, Dispositivo, Categoria, Gravedad } from '@ojo-camba/common';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { ListReportesDto } from './dto/list-reportes.dto';

interface ImagenResult {
  buffer: Buffer;
  contentType: string;
}

const isExternalUrl = (url: string | null): boolean => url?.startsWith('http') === true;

function imageApiPath(reporte: { id: number; url_imagen: string }): string | null {
  if (!reporte.url_imagen) return null;
  if (isExternalUrl(reporte.url_imagen)) return reporte.url_imagen;
  return `/reportes/${reporte.id}/imagen`;
}

/**
 * Área metropolitana de Santa Cruz de la Sierra (incluye Warnes, Cotoca, La
 * Guardia y El Torno), con margen. Un reporte fuera de este recuadro es un
 * error de GPS o un intento de ensuciar el mapa.
 */
export const LIMITES_SANTA_CRUZ = { latMin: -18.1, latMax: -17.5, lngMin: -63.4, lngMax: -62.9 };

export function dentroDeSantaCruz(lat: unknown, lng: unknown): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  return (
    Number.isFinite(la) &&
    Number.isFinite(ln) &&
    la >= LIMITES_SANTA_CRUZ.latMin &&
    la <= LIMITES_SANTA_CRUZ.latMax &&
    ln >= LIMITES_SANTA_CRUZ.lngMin &&
    ln <= LIMITES_SANTA_CRUZ.lngMax
  );
}

/** Reportes que acepta un mismo dispositivo por hora (REPORTES_POR_HORA, por defecto 10). */
export function reportesPorHora(env: NodeJS.ProcessEnv = process.env): number {
  const valor = parseInt(env.REPORTES_POR_HORA ?? '', 10);
  return Number.isInteger(valor) && valor > 0 ? valor : 10;
}

/** Tamaño máximo de la foto ya decodificada. */
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

const FIRMAS: { ext: string; contentType: string; coincide: (b: Buffer) => boolean }[] = [
  {
    ext: 'jpg',
    contentType: 'image/jpeg',
    coincide: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png',
    contentType: 'image/png',
    coincide: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: 'webp',
    contentType: 'image/webp',
    coincide: (b) =>
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

/**
 * La foto llega como data URL. El tipo se decide por los bytes reales del
 * archivo, no por lo que declara el cliente: así no se guarda en el bucket algo
 * que no es una imagen.
 */
export function validarImagen(dataUrl: string): {
  buffer: Buffer;
  ext: string;
  contentType: string;
} {
  const match = dataUrl.match(/^data:image\/[\w.+-]+;base64,(.+)$/);
  if (!match) {
    throw new BadRequestException(
      'Formato de imagen invalido. Se espera data:image/...;base64,...',
    );
  }
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length === 0) throw new BadRequestException('La imagen está vacía.');
  if (buffer.length > MAX_IMAGEN_BYTES) {
    throw new BadRequestException(
      `La imagen pesa ${(buffer.length / 1024 / 1024).toFixed(1)} MB; el máximo es 5 MB.`,
    );
  }
  const tipo = FIRMAS.find((firma) => firma.coincide(buffer));
  if (!tipo) throw new BadRequestException('El archivo no es una imagen JPEG, PNG ni WebP.');
  return { buffer, ext: tipo.ext, contentType: tipo.contentType };
}

@Injectable()
export class RegisterService implements OnModuleInit {
  private readonly logger = new Logger(RegisterService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    @InjectRepository(Reporte)
    private readonly reporteRepo: Repository<Reporte>,
    @InjectRepository(Dispositivo)
    private readonly dispositivoRepo: Repository<Dispositivo>,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
  ) {
    this.bucket = process.env.S3_BUCKET ?? 'reportes';
    this.s3 = new S3Client({
      endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? 'ojocamba',
        secretAccessKey: process.env.S3_SECRET_KEY ?? 'ojocamba_secret',
      },
      forcePathStyle: true,
    });
  }

  async onModuleInit() {
    await this.seedCategorias();

    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.logger.log(`Bucket '${this.bucket}' verificado`);
    } catch (err: unknown) {
      const e = err as { name?: string };
      if (e.name === 'NotFound' || e.name === 'NoSuchBucket') {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.logger.log(`Bucket '${this.bucket}' creado`);
      } else {
        this.logger.warn(
          `No se pudo verificar/crear bucket '${this.bucket}': ${(err as Error).message}`,
        );
      }
    }
  }

  async create(dto: CreateReporteDto) {
    // Un dispositivo baneado por spam no puede seguir reportando. Se revisa
    // antes de subir la foto para no gastar almacenamiento en un rechazo.
    const dispositivo = await this.dispositivoRepo.findOne({
      where: { device_id: dto.device_id },
    });
    if (dispositivo?.is_banned) {
      throw new ForbiddenException('Este dispositivo está bloqueado y no puede enviar reportes.');
    }

    // Este microservicio no tiene ValidationPipe: los decoradores del DTO no se
    // aplican, así que lo esencial se valida acá, antes de tocar S3.
    if (!dentroDeSantaCruz(dto.lat, dto.lng)) {
      throw new BadRequestException(
        'La ubicación del reporte está fuera del área de Santa Cruz de la Sierra.',
      );
    }
    if (dto.gravedad && !(Object.values(Gravedad) as string[]).includes(dto.gravedad)) {
      throw new BadRequestException(`Gravedad inválida: ${dto.gravedad}`);
    }

    const recientes = await this.reporteRepo.count({
      where: { device_id: dto.device_id, creado_en: MoreThan(new Date(Date.now() - 3_600_000)) },
    });
    if (recientes >= reportesPorHora()) {
      throw new HttpException(
        `Este dispositivo ya envió ${recientes} reportes en la última hora. Intenta más tarde.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const categoria = await this.categoriaRepo.findOne({ where: { id: dto.categoria_id } });
    if (!categoria) {
      throw new BadRequestException(`Categoria ${dto.categoria_id} no existe`);
    }

    if (!dto.imagen_base64) {
      throw new BadRequestException('Se requiere imagen en base64');
    }
    const { buffer, ext, contentType } = validarImagen(dto.imagen_base64);
    const s3Key = `${crypto.randomUUID()}.${ext}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const h3res8 = h3.latLngToCell(dto.lat, dto.lng, 8);
    const h3res11 = h3.latLngToCell(dto.lat, dto.lng, 11);
    const h3res13 = h3.latLngToCell(dto.lat, dto.lng, 13);

    if (!h3res8 || !h3res11 || !h3res13) {
      throw new BadRequestException('No se pudieron calcular los indices H3');
    }

    const reporte = this.reporteRepo.create({
      device_id: dto.device_id,
      usuario_id: dto.usuario_id ?? null,
      lat: dto.lat,
      lng: dto.lng,
      categoria_id: dto.categoria_id,
      gravedad: dto.gravedad ?? 'Media',
      h3_res_8: h3res8,
      h3_res_11: h3res11,
      h3_res_13: h3res13,
      url_imagen: s3Key,
    });
    await this.reporteRepo.save(reporte);

    await this.dispositivoRepo.upsert({ device_id: dto.device_id, ultimo_uso: new Date() }, [
      'device_id',
    ]);

    return {
      id: reporte.id,
      h3_res_8: reporte.h3_res_8,
      h3_res_11: reporte.h3_res_11,
      h3_res_13: reporte.h3_res_13,
      url_imagen: `/reportes/${reporte.id}/imagen`,
      estado: reporte.estado,
      creado_en: reporte.creado_en,
    };
  }

  async findById(id: number) {
    const reporte = await this.reporteRepo.findOne({ where: { id } });
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }
    const categoria = await this.categoriaRepo.findOne({ where: { id: reporte.categoria_id } });
    return {
      ...reporte,
      url_imagen: imageApiPath(reporte),
      categoria: categoria?.nombre,
    };
  }

  async list(dto: ListReportesDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const query = this.reporteRepo.createQueryBuilder('r');
    if (dto.estado) query.andWhere('r.estado = :estado', { estado: dto.estado });
    if (dto.categoria_id) query.andWhere('r.categoria_id = :catId', { catId: dto.categoria_id });

    if (dto.h3_cell && dto.h3_resolution) {
      query.andWhere(`r.h3_res_${dto.h3_resolution} = :h3Cell`, { h3Cell: dto.h3_cell });
    } else if (dto.h3_res_8) {
      query.andWhere('r.h3_res_8 = :h3', { h3: dto.h3_res_8 });
    }
    if (dto.device_id) query.andWhere('r.device_id = :deviceId', { deviceId: dto.device_id });
    if (dto.usuario_id) query.andWhere('r.usuario_id = :userId', { userId: dto.usuario_id });
    if (dto.grupo_id) query.andWhere('r.grupo_id = :grupoId', { grupoId: dto.grupo_id });

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('r.creado_en', 'DESC')
      .getManyAndCount();

    const mapped = data.map((r) => ({
      ...r,
      url_imagen: imageApiPath(r),
    }));

    return { data: mapped, total, page, limit };
  }

  async heatmap(resolution: number = 8) {
    return this.reporteRepo
      .createQueryBuilder('r')
      .select(`r.h3_res_${resolution}`, 'h3_cell')
      .addSelect('COUNT(*)', 'count')
      .groupBy(`r.h3_res_${resolution}`)
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async heatmapDetailed(resolution: number = 8, soloActivos = true) {
    const qb = this.reporteRepo
      .createQueryBuilder('r')
      .select(`r.h3_res_${resolution}`, 'h3_cell')
      .addSelect('r.categoria_id', 'categoria_id')
      .addSelect('COUNT(*)', 'count')
      .groupBy(`r.h3_res_${resolution}`)
      .addGroupBy('r.categoria_id')
      .orderBy('count', 'DESC');

    if (soloActivos) {
      qb.where('r.estado != :rechazado', { rechazado: 'Rechazado' });
    }

    return qb.getRawMany();
  }

  async getImagenById(reporteId: number): Promise<ImagenResult> {
    const reporte = await this.reporteRepo.findOne({ where: { id: reporteId } });
    if (!reporte?.url_imagen) {
      throw new NotFoundException('Imagen no encontrada');
    }

    if (isExternalUrl(reporte.url_imagen)) {
      throw new NotFoundException('Imagen no gestionada por el sistema');
    }

    const response = await this.s3.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: reporte.url_imagen,
      }),
    );

    const chunks: Buffer[] = [];
    if (response.Body) {
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
    }

    return {
      buffer: Buffer.concat(chunks),
      contentType: response.ContentType ?? 'image/jpeg',
    };
  }

  async vincularDevice(userId: number, deviceId: string) {
    const result = await this.reporteRepo.update(
      { device_id: deviceId, usuario_id: null as unknown as number },
      { usuario_id: userId },
    );
    return { vinculados: result.affected ?? 0 };
  }

  private async seedCategorias() {
    const nombres = ['bache', 'luminaria', 'residuos', 'alcantarillado', 'trafico', 'otro'];
    for (const nombre of nombres) {
      await this.categoriaRepo.upsert({ nombre }, ['nombre']);
    }
  }
}
