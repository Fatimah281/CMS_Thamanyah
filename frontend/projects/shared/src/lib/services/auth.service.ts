import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface UserRole {
  id: string;
  username: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.user$ = this.userSubject.asObservable();
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userData && userRole) {
      try {
        const user = JSON.parse(userData);
        const role = JSON.parse(userRole);
        
        const userObject: User = {
          uid: user.id,
          email: user.email,
          displayName: user.username,
          emailVerified: true,
          role: role.role
        };
        
        this.userSubject.next(userObject);
      } catch (error) {
        console.error('Error parsing user data from storage:', error);
        this.clearAuthData();
      }
    } else {
      this.userSubject.next(null);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    this.userSubject.next(null);
  }

  private saveAuthData(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('userRole', JSON.stringify(response.user));
    
    const user: User = {
      uid: response.user.id,
      email: response.user.email,
      displayName: response.user.username,
      emailVerified: true,
      role: response.user.role
    };
    this.userSubject.next(user);
  }

  async login(credentials: LoginRequest): Promise<{ user: User; redirectUrl: string }> {
    try {
      const response = await this.http.post<{ success: boolean; data: AuthResponse; message: string }>(
        `${this.apiUrl}/login`,
        credentials
      ).toPromise();

      if (response?.success && response.data) {
        this.saveAuthData(response.data);
        
        const user: User = {
          uid: response.data.user.id,
          email: response.data.user.email,
          displayName: response.data.user.username,
          emailVerified: true,
          role: response.data.user.role
        };

        const redirectUrl = this.getRedirectUrlByRole(response.data.user.role);
        
        return { user, redirectUrl };
      } else {
        throw new Error('Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.error?.message || 'Login failed');
    }
  }

  async register(userData: RegisterRequest): Promise<{ user: User; redirectUrl: string }> {
    try {
      const response = await this.http.post<{ success: boolean; data: AuthResponse; message: string }>(
        `${this.apiUrl}/register`,
        userData
      ).toPromise();

      if (response?.success && response.data) {
        this.saveAuthData(response.data);
        
        const user: User = {
          uid: response.data.user.id,
          email: response.data.user.email,
          displayName: response.data.user.username,
          emailVerified: true,
          role: response.data.user.role
        };

        const redirectUrl = this.getRedirectUrlByRole(response.data.user.role);
        
        return { user, redirectUrl };
      } else {
        throw new Error('Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.error?.message || 'Registration failed');
    }
  }

  getRedirectUrlByRole(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return '/dashboard';
      case 'editor':
        return '/dashboard';
      case 'viewer':
      case 'user':
      default:
        return '/discovery';
    }
  }

  refreshToken(): Observable<void> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<{ success: boolean; data: { accessToken: string }; message: string }>(
      `${this.apiUrl}/refresh`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${refreshToken}`
        }
      }
    ).pipe(
      map(response => {
        if (response?.success && response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
        } else {
          throw new Error('Token refresh failed');
        }
      }),
      catchError(error => {
        console.error('Token refresh error:', error);
        this.clearAuthData();
        return throwError(() => new Error('Token refresh failed'));
      })
    );
  }

  async signOut(): Promise<void> {
    this.clearAuthData();
  }

  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  isAuthenticated(): boolean {
    const isAuth = this.userSubject.value !== null && !!localStorage.getItem('accessToken');
    return isAuth;
  }

  refreshUserState(): void {
    this.loadUserFromStorage();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getUserRole(): string | null {
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      try {
        const role = JSON.parse(userRole);
        return role.role;
      } catch (error) {
        console.error('Error parsing user role:', error);
        return null;
      }
    }
    return null;
  }

  isAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'admin' || role === 'editor';
  }

  isUser(): boolean {
    const role = this.getUserRole();
    return role === 'user' || role === 'viewer';
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}
