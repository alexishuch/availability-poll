import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { AvailabilitiesModule } from './availabilities/availabilities.module';
import { getTypeOrmConfig } from './database/typeorm.config';
import { HealthModule } from './health/health.module';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { ParticipantsModule } from './participants/participants.module';
import { PollsModule } from './polls/polls.module';

@Module({
  imports: [
    // Timezone should be set to UTC
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    HealthModule,
    PollsModule,
    AvailabilitiesModule,
    ParticipantsModule,
  ],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
