import { Controller, Get, Param, Inject, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { TCP_PATTERNS } from '@ojo-camba/common';
import { exigirPropioOGestion, RolesGuard, type TokenValidation } from './roles.guard';

/**
 * Lectura de puntos y niveles. Otorgar puntos NO se expone por HTTP: ms-admin
 * los otorga por TCP al aceptar un reporte, con idempotencia por reporte.
 */
@Controller('gamify')
export class GamifyController {
  constructor(@Inject('MS_GAMIFY') private readonly client: ClientProxy) {}

  @Get('stats/:id')
  @UseGuards(RolesGuard)
  stats(@Req() request: { user: TokenValidation }, @Param('id') id: string) {
    const userId = parseInt(id, 10);
    exigirPropioOGestion(request.user, userId);
    return firstValueFrom(
      this.client.send(TCP_PATTERNS.GAMIFY.GET_USER_STATS, { user_id: userId }),
    );
  }

  @Get('levels')
  levels() {
    return firstValueFrom(this.client.send(TCP_PATTERNS.GAMIFY.GET_LEVELS, {}));
  }
}
