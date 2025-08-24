import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { AuthService, LoginRequest, RegisterRequest } from '../../../../../shared/src/lib/services/auth.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
    MatDividerModule,
    MatTabsModule,
    MatSelectModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  registerForm: FormGroup;
  loading = false;
  error = '';
  userRoles = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' },
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['user', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Check if user is already authenticated
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        console.log('User already authenticated, redirecting based on role');
        const redirectUrl = this.authService.getRedirectUrlByRole(user.role || 'user');
        this.router.navigate([redirectUrl]);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
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
      
      this.snackBar.open('Successfully logged in!', 'Close', { duration: 3000 });
      
      // Redirect based on user role
      if (result.redirectUrl === '/discovery') {
        // Redirect to discovery app
        window.location.href = 'http://localhost:4201';
      } else {
        // Redirect within CMS
        this.router.navigate([result.redirectUrl]);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.error = error.message || 'Failed to login. Please try again.';
      this.snackBar.open(this.error, 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  async onRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const userData: RegisterRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        role: this.registerForm.value.role
      };
      
      const result = await this.authService.register(userData);
      
      this.snackBar.open('Successfully registered!', 'Close', { duration: 3000 });
      
      // Redirect based on user role
      if (result.redirectUrl === '/discovery') {
        // Redirect to discovery app
        window.location.href = 'http://localhost:4201';
      } else {
        // Redirect within CMS
        this.router.navigate([result.redirectUrl]);
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      this.error = error.message || 'Failed to register. Please try again.';
      this.snackBar.open(this.error, 'Close', { duration: 5000 });
    } finally {
      this.loading = false;
    }
  }

  getErrorMessage(fieldName: string, form: FormGroup = this.loginForm): string {
    const field = form.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least 6 characters`;
    }
    if (field?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }
}
