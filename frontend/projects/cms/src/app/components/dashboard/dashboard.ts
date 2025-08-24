import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MatDividerModule } from '@angular/material/divider';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProgramService } from '../../../../../shared/src/lib/services/program.service';
import { AuthService } from '../../../../../shared/src/lib/services/auth.service';
import { Program } from '../../../../../shared/src/lib/models/program.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  user$: Observable<any>;
  programs$: Observable<Program[]>;
  loading = true;
  error = false;
  displayedColumns: string[] = ['title', 'category', 'language', 'duration', 'publishDate', 'actions'];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private programService: ProgramService,
    private authService: AuthService
  ) {
    this.user$ = this.authService.user$;
    
    this.programs$ = this.programService.getPrograms().pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error loading programs:', error);
        this.error = true;
        this.loading = false;
        this.snackBar.open('Error loading programs', 'Close', { duration: 3000 });
        return of([]);
      })
    );
  }

  ngOnInit(): void {
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (!user) {
        console.log('No authenticated user, redirecting to login');
        this.router.navigate(['/login']);
      }
    });

    this.programs$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
      this.snackBar.open('Successfully signed out', 'Close', { duration: 3000 });
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Sign out error:', error);
      this.snackBar.open('Error signing out', 'Close', { duration: 3000 });
    }
  }

  addProgram(): void {
    this.router.navigate(['/programs/new']);
  }

  editProgram(program: Program): void {
    this.router.navigate(['/programs', program.id, 'edit']);
  }

  deleteProgram(program: Program): void {
    const confirmed = confirm(`Are you sure you want to delete "${program.title}"? This action cannot be undone.`);
    
    if (confirmed) {
      this.programService.deleteProgram(program.id).subscribe({
        next: () => {
          this.snackBar.open('Program deleted successfully', 'Close', { duration: 3000 });
          this.programs$ = this.programService.getPrograms().pipe(
            map(response => response.data || [])
          );
        },
        error: (error) => {
          console.error('Error deleting program:', error);
          this.snackBar.open('Error deleting program', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewProgram(program: Program): void {
    this.router.navigate(['/programs', program.id, 'view']);
  }

  playVideo(program: Program): void {
    if (program.youtubeUrl) {
      window.open(program.youtubeUrl, '_blank');
    } else if (program.videoUrl) {
      window.open(program.videoUrl, '_blank');
    } else {
      this.snackBar.open('Video URL not available', 'Close', { duration: 3000 });
    }
  }

  getCategoryName(categoryId: number): string {
    return `Category ${categoryId}`;
  }

  getLanguageName(languageId: number): string {
    return `Language ${languageId}`;
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  formatDate(date: Date | string | any): string {
    try {
      let dateObj: Date;
      
      if (date && typeof date === 'object' && date._seconds) {
        dateObj = new Date(date._seconds * 1000);
      }
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      }
      else if (date instanceof Date) {
        dateObj = date;
      }
      else {
        dateObj = new Date(date);
      }
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  }
}
