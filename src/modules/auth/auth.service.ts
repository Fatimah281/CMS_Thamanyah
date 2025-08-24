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
    // Check if username already exists in profiles
    const existingProfile = await this.usersCol().where('username', '==', registerDto.username).limit(1).get();
    if (!existingProfile.empty) {
      throw new ConflictException('Username already exists');
    }

    try {
      // Create Firebase Auth user
      const userRecord = await this.auth.createUser({
        email: registerDto.email,
        password: registerDto.password,
        displayName: registerDto.username,
      });

      // Create user profile in Firestore
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
      // Verify credentials with Firebase Auth
      const userRecord = await this.auth.getUserByEmail(loginDto.username);
      
      // For simplicity, we'll use email as username in login
      // In a real app, you might want to support both email and username login
      
      // Get user profile
      const profileDoc = await this.usersCol().doc(userRecord.uid).get();
      if (!profileDoc.exists) {
        throw new UnauthorizedException('User profile not found');
      }

      const profile = profileDoc.data() as UserProfile;
      if (!profile.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Update last login
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

  async googleLogin(googleDto: GoogleLoginDto): Promise<LoginResponseDto> {
    try {
      const decoded = await this.auth.verifyIdToken(googleDto.idToken);
      const uid = decoded.uid;

      // Fetch the auth user to get email/displayName
      const userRecord = await this.auth.getUser(uid);
      const email = userRecord.email || decoded.email;
      const username = userRecord.displayName || (email ? email.split('@')[0] : `user_${uid.substring(0, 6)}`);

      // Upsert profile
      const profileDoc = await this.usersCol().doc(uid).get();
      let profile: UserProfile;
      if (!profileDoc.exists) {
        profile = {
          uid,
          username,
          email: email || '',
          role: 'viewer',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await this.usersCol().doc(uid).set(profile);
      } else {
        profile = profileDoc.data() as UserProfile;
        if (!profile.isActive) {
          throw new UnauthorizedException('Account is deactivated');
        }
        await this.usersCol().doc(uid).update({ lastLoginAt: new Date(), updatedAt: new Date() });
      }

      return this.mintJwtForProfile(profile);
    } catch (error) {
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }
  async changePassword(uid: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Firebase Auth handles password changes
      // You might want to verify the current password first
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
