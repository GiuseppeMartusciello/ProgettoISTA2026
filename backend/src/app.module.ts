import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PatientModule } from './patient/patient.module';
import { DoctorModule } from './doctor/doctor.module';
import { MedicalExaminationModule } from './medical-examination/medical-examination.module';
import { UserModule } from './user/user.module';
import { InviteModule } from './invite/invite.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReservationModule } from './reservation/reservation.module';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { MedicalDetectionModule } from './medical-detection/medical-detection.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    // Config globale
    ConfigModule.forRoot({
      isGlobal: true,
      // in produzione (Render) usa solo le env, in locale puoi usare .env
      envFilePath: '.env',
    }),

    // TypeORM + Supabase
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        //
        url: configService.get<string>('DATABASE_URL'), // <-- Ora usa l'URL completo
        autoLoadEntities: true,
        synchronize: false,
        // La configurazione SSL è fondamentale per Supabase, specialmente su Render
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    }),

    AuthModule,
    PatientModule,
    DoctorModule,
    MedicalExaminationModule,
    UserModule,
    InviteModule,
    AvailabilityModule,
    ReservationModule,
    MedicalDetectionModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
  ],
  controllers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'auth/check/email/:email', method: RequestMethod.GET },
        { path: 'auth/check/phone/:phone', method: RequestMethod.GET },
        { path: 'auth/check/cf/:cf', method: RequestMethod.GET },
        { path: 'auth/signup', method: RequestMethod.POST },
        { path: 'auth/signin', method: RequestMethod.POST },
        { path: 'auth/2fa/verify', method: RequestMethod.POST },
        { path: 'invite/:id', method: RequestMethod.GET },
        { path: 'invite/:id/accept', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
