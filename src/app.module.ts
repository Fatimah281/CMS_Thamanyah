import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LanguagesModule } from './modules/languages/languages.module';
import { FirebaseModule } from './config/firebase';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 300, // 5 minutes
    }),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16)).join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        }
      }),
    }),
    FirebaseModule,
    AuthModule,
    ProgramsModule,
    CategoriesModule,
    LanguagesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
