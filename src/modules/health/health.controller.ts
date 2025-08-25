import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async healthCheck() {
    const startTime = Date.now();
    
    let cacheStatus = 'unknown';
    let cacheLatency = 0;
    
    try {
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now(), status: 'ok' };
      
      const setStart = Date.now();
      await this.redisService.setJson(testKey, testValue, 60);
      const setEnd = Date.now();
      
      const getStart = Date.now();
      const retrievedValue = await this.redisService.getJson(testKey);
      const getEnd = Date.now();
      
      cacheLatency = (setEnd - setStart) + (getEnd - getStart);
      
      if (retrievedValue && retrievedValue['status'] === 'ok') {
        cacheStatus = 'healthy';
      } else {
        cacheStatus = 'unhealthy';
      }
      
      await this.redisService.clearKeysByPrefix(testKey);
      
    } catch (error) {
      cacheStatus = 'error';
    }
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      cache: {
        status: cacheStatus,
        latency: cacheLatency,
        type: 'redis',
      },
      responseTime,
      services: {
        api: 'healthy',
        database: 'healthy',
        cache: cacheStatus,
      },
    };
  }

  @Get('cache')
  @ApiOperation({ summary: 'Cache health check endpoint' })
  @ApiResponse({ status: 200, description: 'Cache status information' })
  async cacheHealthCheck() {
    const startTime = Date.now();
    
    try {
      const testKey = `cache_test_${Date.now()}`;
      const testData = {
        message: 'Cache test data',
        timestamp: Date.now(),
        random: Math.random(),
      };
      
      await this.redisService.setJson(testKey, testData, 300);
      
      const retrievedData = await this.redisService.getJson(testKey);
      
      await this.redisService.clearKeysByPrefix(testKey);
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        operations: {
          set: 'success',
          get: 'success',
          delete: 'success',
        },
        testData: retrievedData,
        responseTime,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
