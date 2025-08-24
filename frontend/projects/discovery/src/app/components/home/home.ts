import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ProgramService } from '../../../../../shared/src/lib/services/program.service';
import { CategoryService } from '../../../../../shared/src/lib/services/category.service';
import { LanguageService } from '../../../../../shared/src/lib/services/language.service';
import { DiscoveryAuthService } from '../../services/discovery-auth.service';
import { Program } from '../../../../../shared/src/lib/models/program.model';
import { Category } from '../../../../../shared/src/lib/models/category.model';
import { Language } from '../../../../../shared/src/lib/models/language.model';
import { User } from '../../../../../shared/src/lib/models/user.model';
import { Observable, combineLatest, map, startWith, catchError, of } from 'rxjs';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  programs$: Observable<Program[]>;
  categories$: Observable<Category[]>;
  languages$: Observable<Language[]>;
  user$: Observable<User | null>;
  
  loading = true;
  error = false;
  
  searchControl = new FormControl('');
  categoryFilter = new FormControl('');
  languageFilter = new FormControl('');
  dateFilter = new FormControl('');
  statusFilter = new FormControl('');
  contentTypeFilter = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private authService: DiscoveryAuthService,
    private programService: ProgramService,
    private categoryService: CategoryService,
    private languageService: LanguageService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Initialize user observable with proper typing
    this.user$ = this.authService.user$;
    
    // Load categories and languages for filter dropdowns
    this.categories$ = this.categoryService.getCategories().pipe(
      catchError(error => {
        console.error('Error loading categories:', error);
        return of([]);
      })
    );
    
    this.languages$ = this.languageService.getLanguages().pipe(
      catchError(error => {
        console.error('Error loading languages:', error);
        return of([]);
      })
    );
    
    // Combine all filters to create filtered programs
    this.programs$ = combineLatest([
      this.programService.getPrograms().pipe(
        catchError(error => {
          console.error('Error loading programs:', error);
          return of({ data: [] });
        })
      ),
      this.searchControl.valueChanges.pipe(startWith('')),
      this.categoryFilter.valueChanges.pipe(startWith('')),
      this.languageFilter.valueChanges.pipe(startWith('')),
      this.dateFilter.valueChanges.pipe(startWith('')),
      this.statusFilter.valueChanges.pipe(startWith('')),
      this.contentTypeFilter.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([programsResponse, search, category, language, date, status, contentType]) => {
        const programs = (programsResponse as any).data || [];
        
        const filteredPrograms = programs.filter((program: Program) => {
          // Search filter - search in title, description, and tags
          const searchTerm = search?.toLowerCase().trim();
          const matchesSearch = !searchTerm || 
            program.title?.toLowerCase().includes(searchTerm) ||
            program.description?.toLowerCase().includes(searchTerm) ||
            (program.tags && program.tags.some((tag: string) => 
              tag.toLowerCase().includes(searchTerm)
            ));
          
          // Category filter - handle both categoryId and category object
          const matchesCategory = !category || 
            program.categoryId === parseInt(category) ||
            program.category?.id === parseInt(category);
          
          // Language filter - handle both languageId and language object
          const matchesLanguage = !language || 
            program.languageId === parseInt(language) ||
            program.language?.id === parseInt(language);
          
          // Status filter
          const matchesStatus = !status || 
            program.status?.toLowerCase() === status.toLowerCase();
          
          // Content type filter
          const matchesContentType = !contentType || 
            program.contentType?.toLowerCase() === contentType.toLowerCase();
          
          // Date filter - compare dates properly
          let matchesDate = true;
          if (date) {
            const filterDate = new Date(date);
            const programDate = this.parseProgramDate(program.publishDate);
            
            if (filterDate && programDate && !isNaN(filterDate.getTime()) && !isNaN(programDate.getTime())) {
              // Compare only the date part (year, month, day)
              const filterDateStr = filterDate.toISOString().split('T')[0];
              const programDateStr = programDate.toISOString().split('T')[0];
              matchesDate = filterDateStr === programDateStr;
            } else {
              matchesDate = false; // If we can't parse the date, it doesn't match
            }
          }
          
          return matchesSearch && matchesCategory && matchesLanguage && matchesStatus && matchesContentType && matchesDate;
        });
        
        return filteredPrograms;
      })
    );
  }

  ngOnInit(): void {
    // Manually refresh user state to ensure it's properly loaded
    this.authService.refreshUserState();
    
    // Check if user is already authenticated
    this.authService.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        console.log('User authenticated:', user);
      } else {
        console.log('No user authenticated');
      }
    });

    // Set loading to false when programs are loaded
    this.programs$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loading = false;
    });
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  async signOut(): Promise<void> {
    try {
      await this.authService.signOut();
      this.snackBar.open('Successfully signed out', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Sign out error:', error);
      this.snackBar.open('Error signing out', 'Close', { duration: 3000 });
    }
  }



  getUserDisplayName(user: User): string {
    if (user.displayName) {
      return user.displayName;
    } else if (user.email) {
      // Extract username from email
      return user.email.split('@')[0];
    }
    return 'User';
  }

  getUserRoleDisplay(user: User): string {
    if (user.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    return '';
  }

  viewProgram(program: Program): void {
    this.router.navigate(['/program', program.id]);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  formatDate(date: Date | string | any): string {
    try {
      let dateObj: Date;
      
      // Handle Firestore timestamp objects
      if (date && typeof date === 'object' && date._seconds) {
        dateObj = new Date(date._seconds * 1000);
      }
      // Handle string dates
      else if (typeof date === 'string') {
        dateObj = new Date(date);
      }
      // Handle Date objects
      else if (date instanceof Date) {
        dateObj = date;
      }
      // Handle other cases
      else {
        dateObj = new Date(date);
      }
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.categoryFilter.setValue('');
    this.languageFilter.setValue('');
    this.dateFilter.setValue('');
    this.statusFilter.setValue('');
    this.contentTypeFilter.setValue('');
  }

  getActiveFilters(): any {
    const filters: any = {};
    
    if (this.searchControl.value) filters.search = this.searchControl.value;
    if (this.categoryFilter.value) filters.category = this.categoryFilter.value;
    if (this.languageFilter.value) filters.language = this.languageFilter.value;
    if (this.dateFilter.value) filters.date = this.dateFilter.value;
    if (this.statusFilter.value) filters.status = this.statusFilter.value;
    if (this.contentTypeFilter.value) filters.contentType = this.contentTypeFilter.value;
    
    return filters;
  }

  hasActiveFilters(): boolean {
    return Object.keys(this.getActiveFilters()).length > 0;
  }

  private parseProgramDate(date: any): Date | null {
    try {
      if (!date) return null;
      
      // Handle Firestore timestamp objects
      if (date && typeof date === 'object' && date._seconds) {
        return new Date(date._seconds * 1000);
      }
      // Handle Firestore timestamp with nanoseconds
      if (date && typeof date === 'object' && date.seconds) {
        return new Date(date.seconds * 1000);
      }
      // Handle string dates
      else if (typeof date === 'string') {
        // Handle ISO date strings
        if (date.includes('T') || date.includes('Z')) {
          return new Date(date);
        }
        // Handle date-only strings (YYYY-MM-DD)
        if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return new Date(date + 'T00:00:00');
        }
        // Handle other date formats
        return new Date(date);
      }
      // Handle Date objects
      else if (date instanceof Date) {
        return date;
      }
      // Handle numeric timestamps
      else if (typeof date === 'number') {
        return new Date(date);
      }
      // Handle other cases
      else {
        return new Date(date);
      }
    } catch (error) {
      console.error('Error parsing program date:', error, date);
      return null;
    }
  }

}
