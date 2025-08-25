import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { LoginDto, RegisterDto, LoginResponseDto, GoogleLoginDto } from './dto/auth.dto';

interface UserProfile {
  uid: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  private auth: Auth;

  constructor(
    @Inject('FIRESTORE') private readonly db: Firestore,
    private readonly jwtService: JwtService,
  ) {
    this.auth = getAuth();
  }

  private usersCol() {
    return this.db.collection('user_profiles');
  }

  private async mintJwtForProfile(profile: UserProfile): Promise<LoginResponseDto> {
    const payload = {
      uid: profile.uid,
      username: profile.username,
      email: profile.email,
      role: profile.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return {
      accessToken,
      refreshToken,
      user: {
        id: profile.uid,
        username: profile.username,
        email: profile.email,
        role: profile.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<LoginResponseDto> {
    const existingProfile = await this.usersCol().where('username', '==', registerDto.username).limit(1).get();
    if (!existingProfile.empty) {
      throw new ConflictException('Username already exists');
    }

    try {
      const userRecord = await this.auth.createUser({
        email: registerDto.email,
        password: registerDto.password,
        displayName: registerDto.username,
      });

      const profile: UserProfile = {
        uid: userRecord.uid,
        username: registerDto.username,
        email: registerDto.email,
        role: registerDto.role || 'viewer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.usersCol().doc(userRecord.uid).set(profile);

      return this.mintJwtForProfile(profile);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        throw new ConflictException('Email already exists');
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      const userRecord = await this.auth.getUserByEmail(loginDto.username);
      
      const profileDoc = await this.usersCol().doc(userRecord.uid).get();
      if (!profileDoc.exists) {
        throw new UnauthorizedException('User profile not found');
      }

      const profile = profileDoc.data() as UserProfile;
      if (!profile.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      await this.usersCol().doc(userRecord.uid).update({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      });

      return this.mintJwtForProfile(profile);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(token);
      const accessToken = this.jwtService.sign({
        uid: payload.uid,
        username: payload.username,
        email: payload.email,
        role: payload.role,
      });
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(uid: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      await this.auth.updateUser(uid, { password: newPassword });
    } catch (error) {
      throw new BadRequestException('Password change failed');
    }
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const doc = await this.usersCol().doc(uid).get();
    return doc.exists ? (doc.data() as UserProfile) : null;
  }
}

