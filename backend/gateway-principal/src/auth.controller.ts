import { Controller, Post, Get, Body, Param, Inject, Req, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TCP_PATTERNS } from '@ojo-camba/common';
import { sendRpc } from './rpc.helper';
import { exigirPropioOGestion, RolesGuard, type TokenValidation } from './roles.guard';

type AuthenticatedRequest = { user: TokenValidation };

@Controller('auth')
export class AuthController {
  constructor(@Inject('MS_AUTH') private readonly client: ClientProxy) {}

  @Post('register')
  register(@Body() dto: { nombre: string; email: string; password: string }) {
    return sendRpc(this.client.send(TCP_PATTERNS.AUTH.REGISTER, dto));
  }

  @Post('login')
  login(@Body() dto: { email: string; password: string }) {
    return sendRpc(this.client.send(TCP_PATTERNS.AUTH.LOGIN, dto));
  }

  @Post('refresh')
  refresh(@Body() dto: { refresh_token: string }) {
    return sendRpc(this.client.send(TCP_PATTERNS.AUTH.REFRESH, dto));
  }

  /** Cierra la sesión del dueño del token; el cuerpo no decide a quién. */
  @Post('logout')
  @UseGuards(RolesGuard)
  logout(@Req() request: AuthenticatedRequest) {
    return sendRpc(this.client.send(TCP_PATTERNS.AUTH.LOGOUT, { user_id: request.user.user_id }));
  }

  @Post('validate')
  validate(@Body() dto: { token: string }) {
    return sendRpc(this.client.send(TCP_PATTERNS.AUTH.VALIDATE_TOKEN, dto));
  }

  @Get('profile/:id')
  @UseGuards(RolesGuard)
  profile(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    const userId = parseInt(id, 10);
    exigirPropioOGestion(request.user, userId);
    return sendRpc(this.client.send(TCP_PATTERNS.AUTH.GET_PROFILE, { user_id: userId }));
  }
}
