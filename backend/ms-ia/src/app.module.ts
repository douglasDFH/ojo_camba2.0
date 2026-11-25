import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTIDADES } from '@ojo-camba/common';
import { IaModule } from './ia.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        url: configService.get<string>('DATABASE_URL'),
        entities: ENTIDADES,
        autoLoadEntities: true,
        synchronize: false,
        logging: ['error'],
        retryAttempts: 5,
        retryDelay: 3000,
      }),
    }),
    IaModule,
  ],
})
export class AppModule {}
