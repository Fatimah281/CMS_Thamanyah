import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @Inject('FIRESTORE') private readonly db: Firestore,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    console.log('🔑 JWT Secret configured:', jwtSecret ? 'Yes' : 'No');
    
    if (!jwtSecret) {
      console.warn('⚠️ JWT_SECRET not found in environment variables');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const profileDoc = await this.db.collection('user_profiles').doc(payload.uid).get();
    
    if (!profileDoc.exists) {
      throw new UnauthorizedException('User profile not found');
    }

    const profile = profileDoc.data();
    if (!profile.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    return {
      uid: payload.uid,
      id: payload.uid,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}
