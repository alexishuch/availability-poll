import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { getTypeOrmConfig } from './database/typeorm.config';
import { PollsModule } from './polls/polls.module';
import { AvailabilitiesModule } from './availabilities/availabilities.module';
import { ParticipantsModule } from './participants/participants.module';

@Module({
  imports: [
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
