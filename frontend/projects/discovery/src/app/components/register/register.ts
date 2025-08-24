import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { DiscoveryAuthService, RegisterRequest } from '../../services/discovery-auth.service';

@Component({
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-content>
          <div class="register-header">
            <mat-icon class="register-icon">person_add</mat-icon>
            <h1>Create Account</h1>
            <p>Join Thamanyah Discovery to explore our educational content</p>
          </div>
          
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="Enter your username" required>
              <mat-error *ngIf="registerForm.get('username')?.hasError('required')">
                Username is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('username')?.hasError('minlength')">
                Username must be at least 3 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email" required>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email address
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" placeholder="Enter your password" required>
              <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Confirm Password</mat-label>
              <input matInput type="password" formControlName="confirmPassword" placeholder="Confirm your password" required>
              <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                Please confirm your password
              </mat-error>
              <mat-error *ngIf="registerForm.hasError('passwordMismatch')">
                Passwords do not match
              </mat-error>
            </mat-form-field>

            <div class="register-actions">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="loading || registerForm.invalid"
                class="register-btn">
                <mat-icon>person_add</mat-icon>
                <span *ngIf="!loading">Create Account</span>
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
              </button>
            </div>

            <mat-divider class="divider"></mat-divider>

            <div class="login-link">
              <p>Already have an account? <a (click)="goToLogin()" class="link">Sign In</a></p>
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
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .register-card {
      max-width: 450px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    
    .register-header {
      margin-bottom: 32px;
    }
    
    .register-icon {
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
    
    .register-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .form-field {
      width: 100%;
    }
    
    .register-actions {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 8px;
    }
    
    .register-btn {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .register-btn mat-icon {
      margin-right: 8px;
    }
    
    .divider {
      margin: 24px 0;
    }
    
    .login-link {
      text-align: center;
    }
    
    .login-link p {
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
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';

  constructor(
    private authService: DiscoveryAuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    
    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const userData: RegisterRequest = this.registerForm.value;
      const result = await this.authService.register(userData);
      
      this.snackBar.open('Account created successfully!', 'Close', { duration: 3000 });
      
      // Redirect to home after successful registration
      setTimeout(() => {
        this.router.navigate([result.redirectUrl]);
      }, 1000);
    } catch (error: any) {
      console.error('Registration error:', error);
      this.error = error.message || 'Failed to create account. Please try again.';
      this.snackBar.open(this.error, 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
