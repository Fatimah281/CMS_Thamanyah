import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProgramService } from '../../../../../shared/src/lib/services/program.service';
import { CategoryService } from '../../../../../shared/src/lib/services/category.service';
import { LanguageService } from '../../../../../shared/src/lib/services/language.service';
import { VideoUploadService } from '../../../../../shared/src/lib/services/video-upload.service';
import { Program, ProgramFormData } from '../../../../../shared/src/lib/models/program.model';
import { Category } from '../../../../../shared/src/lib/models/category.model';
import { Language } from '../../../../../shared/src/lib/models/language.model';
import { Observable, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-program-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './program-form.html',
  styleUrl: './program-form.scss'
})
export class ProgramFormComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  programForm: FormGroup;
  categories$: Observable<Category[]>;
  languages$: Observable<Language[]>;
  isEditMode = false;
  programId: string | null = null;
  loading = false;
  
  // File upload properties
  selectedFile: File | null = null;
  videoDuration: number | null = null;
  videoPreviewUrl: string | null = null;
  isDragOver = false;

  constructor(
    private fb: FormBuilder,
    private programService: ProgramService,
    private categoryService: CategoryService,
    private languageService: LanguageService,
    private videoUploadService: VideoUploadService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.programForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      categoryId: [''],
      languageId: [''],
      duration: [''],
      publishDate: [''],
      contentType: ['video'],
      videoSource: ['youtube'],
      videoUrl: [''],
      audioUrl: [''],
      thumbnailUrl: [''],
      status: ['draft'],
      isActive: [true]
    });

    this.categories$ = this.categoryService.getCategories();
    this.languages$ = this.languageService.getLanguages();

    // Watch for video source changes
    this.programForm.get('videoSource')?.valueChanges.subscribe(source => {
      this.onVideoSourceChange(source);
    });

    // Watch for video URL changes
    this.programForm.get('videoUrl')?.valueChanges.subscribe(url => {
      if (url && this.programForm.get('videoSource')?.value === 'youtube') {
        this.onYouTubeUrlChange(url);
      }
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.programId = params['id'];
        this.loadProgram();
      }
    });

    // Track form changes for edit mode
    this.programForm.valueChanges.subscribe(() => {
      // This will help track when the form has been modified
      if (this.isEditMode) {
        // The form is now dirty (has changes)
        console.log('Form has been modified');
      }
    });
  }

  private loadProgram(): void {
    if (this.programId) {
      this.programService.getProgram(this.programId).subscribe(program => {
        if (program) {
          // Update video source first to set proper validation
          const videoSource = program.videoSource || 'youtube';
          this.programForm.patchValue({
            videoSource: videoSource
          });
          
          // Update validation based on video source
          this.onVideoSourceChange(videoSource);
          
          // Now patch the rest of the values
          this.programForm.patchValue({
            title: program.title,
            description: program.description,
            categoryId: program.categoryId,
            languageId: program.languageId,
            duration: program.duration,
            publishDate: this.formatDateForInput(program.publishDate),
            contentType: program.contentType || 'video',
            videoUrl: program.videoUrl || program.youtubeUrl || '',
            audioUrl: program.audioUrl || '',
            thumbnailUrl: program.thumbnailUrl || '',
            status: program.status || 'draft',
            isActive: program.isActive !== false
          });

          if (program.youtubeThumbnail) {
            this.videoPreviewUrl = program.youtubeThumbnail;
          }
          
          // Mark form as pristine after loading
          this.programForm.markAsPristine();
          this.programForm.markAsUntouched();
        }
      });
    }
  }

  private formatDateForInput(date: Date | string): string {
    if (typeof date === 'string') {
      return date;
    }
    return new Date(date).toISOString().split('T')[0];
  }

  // URL validator
  urlValidator(control: AbstractControl): { [key: string]: any } | null {
    if (!control.value) return null; // Allow empty values
    
    const videoSource = this.programForm.get('videoSource')?.value;
    
    if (videoSource === 'youtube') {
      const youtubeId = this.videoUploadService.extractYouTubeId(control.value);
      return youtubeId ? null : { invalidUrl: true };
    } else if (videoSource === 'external') {
      return this.videoUploadService.validateVideoUrl(control.value) ? null : { invalidUrl: true };
    }
    
    return null;
  }

  // Handle video source changes
  onVideoSourceChange(source: string): void {
    const videoUrlControl = this.programForm.get('videoUrl');
    
    if (source === 'upload') {
      videoUrlControl?.clearValidators();
      videoUrlControl?.setValue('');
    } else if (source === 'youtube' || source === 'external') {
      // Make video URL optional but validate if provided
      videoUrlControl?.setValidators([this.urlValidator.bind(this)]);
    } else {
      videoUrlControl?.clearValidators();
    }
    
    videoUrlControl?.updateValueAndValidity();
    this.clearVideoPreview();
  }

  // Handle YouTube URL changes
  onYouTubeUrlChange(url: string): void {
    const videoId = this.videoUploadService.extractYouTubeId(url);
    if (videoId) {
      this.videoPreviewUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
  }

  // File upload handlers
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFileSelection(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('video/')) {
        this.handleFileSelection(file);
      } else {
        this.snackBar.open('Please select a valid video file', 'Close', { duration: 3000 });
      }
    }
  }

  private handleFileSelection(file: File): void {
    try {
      this.videoUploadService.validateFile(file);
      this.selectedFile = file;
      this.videoPreviewUrl = URL.createObjectURL(file);
      
      // Get video duration
      this.videoUploadService.getVideoDuration(file).subscribe(duration => {
        this.videoDuration = duration;
        this.programForm.patchValue({ duration: Math.round(duration / 60) });
      });
      
    } catch (error: any) {
      this.snackBar.open(error.message, 'Close', { duration: 3000 });
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.videoDuration = null;
    this.clearVideoPreview();
  }

  private clearVideoPreview(): void {
    if (this.videoPreviewUrl) {
      URL.revokeObjectURL(this.videoPreviewUrl);
      this.videoPreviewUrl = null;
    }
  }

  formatFileSize(bytes: number): string {
    return this.videoUploadService.formatFileSize(bytes);
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  async onSubmit(): Promise<void> {
    // Check if form is valid (only title and description are required)
    if (this.programForm.get('title')?.valid && this.programForm.get('description')?.valid) {
      this.loading = true;
      const formData: ProgramFormData = this.programForm.value;

      try {
        // Handle file upload if needed
        if (this.selectedFile && formData.videoSource === 'upload') {
          const uploadResult = await this.videoUploadService.uploadVideo(this.selectedFile).toPromise();
          if (uploadResult) {
            formData.videoUrl = uploadResult.url;
          } else {
            throw new Error('Failed to upload video file');
          }
        }

        // Convert date to required format if provided
        if (formData.publishDate) {
          const date = new Date(formData.publishDate);
          formData.publishDate = date.toISOString().split('T')[0]; // Format: "2024-01-25"
        }

        // Set default values for optional fields if not provided
        if (!formData.contentType) formData.contentType = 'video';
        if (!formData.videoSource) formData.videoSource = 'youtube';
        if (!formData.status) formData.status = 'draft';

        if (this.isEditMode && this.programId) {
          await this.programService.updateProgram(this.programId, formData).toPromise();
          this.snackBar.open('Program updated successfully', 'Close', { duration: 3000 });
        } else {
          await this.programService.createProgram(formData).toPromise();
          this.snackBar.open('Program created successfully', 'Close', { duration: 3000 });
        }
        this.router.navigate(['/dashboard']);
      } catch (error: any) {
        console.error('Error saving program:', error);
        
        // Handle validation errors from backend
        if (error.error && error.error.errors && Array.isArray(error.error.errors)) {
          const errorMessages = error.error.errors.join('\n');
          this.snackBar.open(`Validation errors:\n${errorMessages}`, 'Close', { 
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } else {
          this.snackBar.open('Error saving program', 'Close', { duration: 3000 });
        }
      } finally {
        this.loading = false;
      }
    } else {
      // Show specific validation errors for required fields
      this.showValidationErrors();
      this.programForm.markAllAsTouched();
    }
  }

  private showValidationErrors(): void {
    const errors: string[] = [];
    
    if (this.programForm.get('title')?.hasError('required')) {
      errors.push('Title is required');
    } else if (this.programForm.get('title')?.hasError('minlength')) {
      errors.push('Title must be at least 3 characters');
    }
    
    if (this.programForm.get('description')?.hasError('required')) {
      errors.push('Description is required');
    } else if (this.programForm.get('description')?.hasError('minlength')) {
      errors.push('Description must be at least 10 characters');
    }
    
    if (errors.length > 0) {
      this.snackBar.open(`Please fix the following errors:\n${errors.join('\n')}`, 'Close', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
