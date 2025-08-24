import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProgramService } from '../../../../../shared/src/lib/services/program.service';
import { Program } from '../../../../../shared/src/lib/models/program.model';
import { Observable, switchMap, of, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-program-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './program-detail.html',
  styleUrl: './program-detail.scss'
})
export class ProgramDetailComponent implements OnInit, OnDestroy {
  program$: Observable<Program | null>;
  loading = true;
  error = false;
  private destroy$ = new Subject<void>();

  // Content player properties
  videoUrl: SafeResourceUrl | null = null;
  audioUrl: string | null = null;
  youtubeEmbedUrl: SafeResourceUrl | null = null;
  hasContent = false;
  contentError = false;
  contentErrorMessage = '';

  constructor(
    private programService: ProgramService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private snackBar: MatSnackBar
  ) {
    this.program$ = this.route.params.pipe(
      switchMap(params => {
        if (params['id']) {
          const id = params['id'].toString();
          return this.programService.getProgram(id);
        }
        return of(null);
      })
    );
  }

  ngOnInit(): void {
    this.program$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (program) => {
        this.loading = false;
        if (!program) {
          this.snackBar.open('Program not found', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        } else {
          this.setupContentPlayer(program);
        }
      },
      error: (error) => {
        console.error('Error loading program:', error);
        this.loading = false;
        this.error = true;
        this.snackBar.open('Error loading program', 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupContentPlayer(program: Program): void {
    this.hasContent = false;
    this.contentError = false;
    this.contentErrorMessage = '';

    try {
      if (program.contentType === 'video') {
        this.setupVideoPlayer(program);
      } else if (program.contentType === 'podcast') {
        this.setupAudioPlayer(program);
      } else {
        this.contentError = true;
        this.contentErrorMessage = 'Unsupported content type';
      }
    } catch (error) {
      console.error('Error setting up content player:', error);
      this.contentError = true;
      this.contentErrorMessage = 'Failed to load content player';
    }
  }

  private setupVideoPlayer(program: Program): void {
    if (program.videoSource === 'youtube' && program.youtubeVideoId) {
      this.setupYouTubePlayer(program.youtubeVideoId);
    } else if (program.videoSource === 'upload' && program.uploadedVideoUrl) {
      this.setupHTML5VideoPlayer(program.uploadedVideoUrl);
    } else if (program.videoSource === 'external' && program.videoUrl) {
      this.setupExternalVideoPlayer(program.videoUrl);
    } else if (program.videoUrl && this.isYouTubeUrl(program.videoUrl)) {
      const videoId = this.extractYouTubeVideoId(program.videoUrl);
      if (videoId) {
        this.setupYouTubePlayer(videoId);
      } else {
        this.setupHTML5VideoPlayer(program.videoUrl);
      }
    } else if (program.videoUrl) {
      this.setupHTML5VideoPlayer(program.videoUrl);
    } else {
      this.contentError = true;
      this.contentErrorMessage = 'No video content available';
    }
  }

  private setupAudioPlayer(program: Program): void {
    if (program.audioUrl) {
      this.audioUrl = program.audioUrl;
      this.hasContent = true;
    } else {
      this.contentError = true;
      this.contentErrorMessage = 'No audio content available';
    }
  }

  private setupYouTubePlayer(videoId: string): void {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    this.youtubeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.hasContent = true;
  }

  private setupHTML5VideoPlayer(videoUrl: string): void {
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    this.hasContent = true;
  }

  private setupExternalVideoPlayer(videoUrl: string): void {
    if (this.isVimeoUrl(videoUrl)) {
      this.setupVimeoPlayer(videoUrl);
    } else {
      this.setupHTML5VideoPlayer(videoUrl);
    }
  }

  private isVimeoUrl(url: string): boolean {
    return url.includes('vimeo.com');
  }

  private setupVimeoPlayer(vimeoUrl: string): void {
    const vimeoId = this.extractVimeoId(vimeoUrl);
    if (vimeoId) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}?h=hash&dnt=1`;
      this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
      this.hasContent = true;
    } else {
      this.contentError = true;
      this.contentErrorMessage = 'Invalid Vimeo URL';
    }
  }

  private extractVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  private isYouTubeUrl(url: string): boolean {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  private extractYouTubeVideoId(url: string): string | null {
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return watchMatch[1];
    }
    
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return shortMatch[1];
    }
    
    const embedMatch = url.match(/youtube\.com\/embed\/([^?]+)/);
    if (embedMatch) {
      return embedMatch[1];
    }
    
    return null;
  }

  onVideoError(): void {
    this.contentError = true;
    this.contentErrorMessage = 'Failed to load video content';
    this.snackBar.open('Video failed to load', 'Close', { duration: 3000 });
  }

  onAudioError(): void {
    this.contentError = true;
    this.contentErrorMessage = 'Failed to load audio content';
    this.snackBar.open('Audio failed to load', 'Close', { duration: 3000 });
  }

  retryContent(): void {
    this.program$.pipe(takeUntil(this.destroy$)).subscribe(program => {
      if (program) {
        this.setupContentPlayer(program);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  editProgram(): void {
    this.program$.pipe(takeUntil(this.destroy$)).subscribe(program => {
      if (program) {
        this.router.navigate(['/programs', program.id, 'edit']);
      }
    });
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
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        dateObj = new Date(date);
      }
      
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  }

  getContentTypeIcon(): string {
    return 'play_circle';
  }

  getStatusColor(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'primary';
      case 'draft':
        return 'accent';
      case 'archived':
        return 'warn';
      default:
        return 'primary';
    }
  }

  getStatusIcon(status?: string): string {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'check_circle';
      case 'draft':
        return 'edit';
      case 'archived':
        return 'archive';
      default:
        return 'info';
    }
  }
}
