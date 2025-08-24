import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { VideoUploadResponse } from '../models/program.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VideoUploadService {
  private readonly UPLOAD_URL = `${environment.apiUrl}/programs/upload`;
  private readonly MAX_FILE_SIZE = 500 * 1024 * 1024;
  private readonly ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];

  constructor(private http: HttpClient) {}

  uploadVideo(file: File): Observable<VideoUploadResponse> {
    if (!this.validateFile(file)) {
      throw new Error('Invalid file type or size');
    }

    const formData = new FormData();
    formData.append('video', file);

    return this.http.post<VideoUploadResponse>(this.UPLOAD_URL, formData).pipe(
      catchError(error => {
        console.error('Upload error:', error);
        throw new Error('Failed to upload video');
      })
    );
  }

  validateFile(file: File): boolean {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${this.formatFileSize(this.MAX_FILE_SIZE)}`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Supported formats: MP4, WebM, OGG, AVI, MOV');
    }

    return true;
  }

  extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  getYouTubeInfo(url: string): Observable<any> {
    const videoId = this.extractYouTubeId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    return of({
      id: videoId,
      title: 'YouTube Video',
      duration: '00:10:00',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    });
  }

  validateVideoUrl(url: string): boolean {
    const validDomains = [
      'youtube.com',
      'youtu.be',
      'vimeo.com',
      'dailymotion.com',
      'facebook.com',
      'instagram.com'
    ];

    try {
      const urlObj = new URL(url);
      return validDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getVideoDuration(file: File): Observable<number> {
    return new Observable(observer => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        observer.next(Math.round(video.duration));
        observer.complete();
      };
      
      video.onerror = () => {
        observer.error('Could not load video metadata');
      };
      
      video.src = URL.createObjectURL(file);
    });
  }
}
