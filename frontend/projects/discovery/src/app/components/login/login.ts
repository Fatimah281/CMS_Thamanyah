import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DiscoveryAuthService, LoginRequest } from '../../services/discovery-auth.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-content>
          <div class="login-header">
            <mat-icon class="login-icon">explore</mat-icon>
            <h1>Welcome to Thamanyah Discovery</h1>
            <p>Sign in to explore our collection of educational content</p>
          </div>
          
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Username or Email</mat-label>
              <input matInput formControlName="username" placeholder="Enter your username or email" required>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                Username or email is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" placeholder="Enter your password" required>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <div class="login-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="loading || loginForm.invalid"
                class="login-btn">
                <mat-icon>login</mat-icon>
                <span *ngIf="!loading">Sign In</span>
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              </button>
            </div>

            <mat-divider class="divider"></mat-divider>

            <div class="register-link">
              <p>Don't have an account? <a (click)="goToRegister()" class="link">Sign Up</a></p>
            </div>

            <mat-divider class="divider"></mat-divider>

            <div class="back-link">
              <button mat-button (click)="goToHome()" class="back-btn">
                <mat-icon>arrow_back</mat-icon>
                Back to Home
              </button>
            </div>

            <div *ngIf="error" class="error-message">
              {{ error }}
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .login-header {
      margin-bottom: 32px;
    }
    
    .login-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #667eea;
      margin-bottom: 16px;
    }
    
    h1 {
      margin: 0 0 8px 0;
      color: #333;
      font-size: 24px;
      font-weight: 600;
    }
    
    p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }
    
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-field {
      width: 100%;
    }
    
    .login-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    
    .login-btn {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .login-btn mat-icon {
      margin-right: 8px;
    }
    
    .divider {
      margin: 24px 0;
    }
    
    .register-link {
      text-align: center;
    }
    
    .register-link p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
    
    .link {
      color: #667eea;
      text-decoration: none;
      cursor: pointer;
      font-weight: 500;
    }
    
    .link:hover {
      text-decoration: underline;
    }
    
    .back-link {
      text-align: center;
      margin-top: 16px;
    }
    
    .back-btn {
      color: #666;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
      margin: 0 auto;
    }
    
    .back-btn:hover {
      color: #333;
    }
    
    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-top: 16px;
      padding: 8px;
      background-color: #ffebee;
      border-radius: 4px;
      border: 1px solid #ffcdd2;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private authService: DiscoveryAuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const credentials: LoginRequest = this.loginForm.value;
      const result = await this.authService.login(credentials);
      
      this.snackBar.open('Successfully signed in!', 'Close', { duration: 3000 });
      
      // Redirect to home after successful login
      setTimeout(() => {
        this.router.navigate([result.redirectUrl]);
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      this.error = error.message || 'Invalid username or password. Please try again.';
      this.snackBar.open(this.error, 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
