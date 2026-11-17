import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EventsGateway } from './events.gateway';

@Module({
  // El gateway de eventos valida tokens contra ms-auth en el handshake.
  imports: [
    ClientsModule.register([
      {
        name: 'MS_AUTH',
        transport: Transport.TCP,
        options: {
          host: process.env.MS_AUTH_HOST ?? 'localhost',
          port: parseInt(process.env.MS_AUTH_PORT ?? '3001', 10),
        },
      },
    ]),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
