import { Controller, Post, Body, Param, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ROLES, TCP_PATTERNS } from '@ojo-camba/common';
import { sendRpc } from './rpc.helper';
import { RequireRoles, RolesGuard } from './roles.guard';

export interface InferirTriajeDto {
  categoria_id: number;
  creado_en: string;
  distancias_cercanas_m?: number[];
  ubicacion_sensible?: string;
  palabra_clave_riesgo?: boolean;
  temporada_forzada?: string;
}

/**
 * Cada ruta pide el rol de la pantalla que la usa: triaje y análisis de foto
 * los usa la bandeja de moderación; la recomendación de cuadrilla, el
 * coordinador en el detalle del caso (antes exigía backoffice y el coordinador
 * recibía 403).
 */
@Controller('ia')
@UseGuards(RolesGuard)
export class IaController {
  constructor(@Inject('MS_IA') private readonly client: ClientProxy) {}

  @Post('triaje')
  @RequireRoles(ROLES.BACKOFFICE)
  inferirTriaje(@Body() dto: InferirTriajeDto) {
    return sendRpc(this.client.send(TCP_PATTERNS.IA.INFERIR_TRIAJE, dto));
  }

  @Post('casos/:id/recomendar-cuadrilla')
  @RequireRoles(ROLES.COORDINADOR_OPERATIVO)
  recomendarCuadrilla(@Param('id') id: string) {
    return sendRpc(
      this.client.send(TCP_PATTERNS.IA.RECOMENDAR_CUADRILLA, { grupo_id: parseInt(id, 10) }),
    );
  }

  @Post('reportes/:id/sugerencia-hechos')
  @RequireRoles(ROLES.BACKOFFICE)
  sugerirHechos(
    @Param('id') id: string,
    @Body() dto: { nearby_report_ids?: number[]; nearby_group_ids?: number[] },
  ) {
    return sendRpc(
      this.client.send(TCP_PATTERNS.IA.SUGERIR_HECHOS, {
        reporte_id: parseInt(id, 10),
        nearby_report_ids: dto?.nearby_report_ids,
        nearby_group_ids: dto?.nearby_group_ids,
      }),
    );
  }
}
