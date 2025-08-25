import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ProgramsController } from './programs.controller';
import { ProgramsService } from './programs.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // 5 minutes cache
      max: 1000, // maximum number of items in cache
    }),
    RedisModule,
  ],
  controllers: [ProgramsController],
  providers: [ProgramsService],
  exports: [ProgramsService],
})
export class ProgramsModule {}
