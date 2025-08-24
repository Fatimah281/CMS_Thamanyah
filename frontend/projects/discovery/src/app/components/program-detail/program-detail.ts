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
          // Convert to string if it's a number
          const id = params['id'].toString();
          return this.programService.getProgram(id);
        }
        return of(null);
      })
    );
  }

  ngOnInit(): void {
    console.log('ProgramDetailComponent ngOnInit called');
    this.program$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (program) => {
        console.log('Program data received:', program);
        console.log('Program title:', program?.title);
        console.log('Program content type:', program?.contentType);
        console.log('Program video URL:', program?.videoUrl);
        this.loading = false;
        if (!program) {
          console.log('No program found, navigating to home');
          this.router.navigate(['/']);
        } else {
          console.log('Setting up content player for program:', program.title);
          this.setupContentPlayer(program);
        }
      },
      error: (error) => {
        console.error('Error loading program:', error);
        this.loading = false;
        this.error = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupContentPlayer(program: Program): void {
    console.log('Setting up content player for:', program.contentType);
    this.hasContent = false;
    this.contentError = false;
    this.contentErrorMessage = '';

    try {
      if (program.contentType === 'video') {
        console.log('Setting up video player');
        this.setupVideoPlayer(program);
      } else if (program.contentType === 'podcast') {
        console.log('Setting up audio player');
        this.setupAudioPlayer(program);
      } else {
        console.log('Unsupported content type:', program.contentType);
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
    console.log('Setting up video player with:', {
      videoSource: program.videoSource,
      youtubeVideoId: program.youtubeVideoId,
      videoUrl: program.videoUrl,
      uploadedVideoUrl: program.uploadedVideoUrl
    });
    
    // Priority order: YouTube > Uploaded Video > External Video URL
    if (program.videoSource === 'youtube' && program.youtubeVideoId) {
      console.log('Setting up YouTube player with ID:', program.youtubeVideoId);
      this.setupYouTubePlayer(program.youtubeVideoId);
    } else if (program.videoSource === 'upload' && program.uploadedVideoUrl) {
      console.log('Setting up uploaded video player');
      this.setupHTML5VideoPlayer(program.uploadedVideoUrl);
    } else if (program.videoSource === 'external' && program.videoUrl) {
      console.log('Setting up external video player');
      this.setupExternalVideoPlayer(program.videoUrl);
    } else if (program.videoUrl && this.isYouTubeUrl(program.videoUrl)) {
      // Handle YouTube URLs from videoUrl field
      console.log('Detected YouTube URL in videoUrl field');
      const videoId = this.extractYouTubeVideoId(program.videoUrl);
      if (videoId) {
        console.log('Extracted YouTube video ID:', videoId);
        this.setupYouTubePlayer(videoId);
      } else {
        console.log('Could not extract YouTube video ID, using HTML5 player');
        this.setupHTML5VideoPlayer(program.videoUrl);
      }
    } else if (program.videoUrl) {
      console.log('Setting up HTML5 video player with URL:', program.videoUrl);
      this.setupHTML5VideoPlayer(program.videoUrl);
    } else {
      console.log('No video content available');
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
    console.log('Setting up YouTube player with video ID:', videoId);
    const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    console.log('YouTube embed URL:', embedUrl);
    this.youtubeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    this.hasContent = true;
    console.log('YouTube player setup complete, hasContent:', this.hasContent);
  }

  private setupHTML5VideoPlayer(videoUrl: string): void {
    console.log('Setting up HTML5 video player with URL:', videoUrl);
    this.videoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoUrl);
    this.hasContent = true;
    console.log('HTML5 video player setup complete, hasContent:', this.hasContent);
  }

  private setupExternalVideoPlayer(videoUrl: string): void {
    // For external videos, we'll try to embed them if they're from supported platforms
    if (this.isVimeoUrl(videoUrl)) {
      this.setupVimeoPlayer(videoUrl);
    } else {
      // For other external videos, use HTML5 player
      this.setupHTML5VideoPlayer(videoUrl);
    }
  }

  private isVimeoUrl(url: string): boolean {
    return url.includes('vimeo.com');
  }

  private setupVimeoPlayer(vimeoUrl: string): void {
    // Extract Vimeo ID and create embed URL
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
    // Handle youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/);
    if (watchMatch) {
      return watchMatch[1];
    }
    
    // Handle youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) {
      return shortMatch[1];
    }
    
    // Handle youtube.com/embed/VIDEO_ID
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
    this.router.navigate(['/']);
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
    return this.program$ ? 
      (this.program$ as any).contentType === 'video' ? 'video_library' : 'audiotrack' : 
      'play_circle';
  }

  getVideoFormat(videoUrl?: string): string {
    if (!videoUrl) return 'Unknown';
    
    const extension = videoUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'MP4 (H.264)';
      case 'webm':
        return 'WebM (VP8/VP9)';
      case 'ogg':
        return 'Ogg (Theora)';
      case 'avi':
        return 'AVI';
      case 'mov':
        return 'QuickTime (MOV)';
      case 'wmv':
        return 'Windows Media (WMV)';
      case 'flv':
        return 'Flash Video (FLV)';
      default:
        return extension ? extension.toUpperCase() : 'Unknown';
    }
  }

  getAudioFormat(audioUrl?: string): string {
    if (!audioUrl) return 'Unknown';
    
    const extension = audioUrl.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3':
        return 'MP3';
      case 'wav':
        return 'WAV';
      case 'ogg':
        return 'Ogg Vorbis';
      case 'aac':
        return 'AAC';
      case 'flac':
        return 'FLAC';
      case 'm4a':
        return 'M4A';
      case 'wma':
        return 'Windows Media Audio (WMA)';
      default:
        return extension ? extension.toUpperCase() : 'Unknown';
    }
  }

  getStatusColor(status: string): string {
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

  getStatusIcon(status: string): string {
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

  formatDateTime(date: Date | string | any): string {
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
      
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date time:', error, date);
      return 'Invalid Date';
    }
  }
}
