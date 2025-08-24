import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { YouTubeVideo, Program } from '../models/program.model';

@Injectable({
  providedIn: 'root'
})
export class YouTubeService {
  private readonly API_KEY = 'AIzaSyDbsWt538ceKRqglvWqgb3Ra2aKpSsV8Bk';
  private readonly CHANNEL_ID = 'UC-EAaNIDtW85oo7eDU1tlnQ'; 
  private readonly BASE_URL = 'https://www.googleapis.com/youtube/v3';

  constructor(private http: HttpClient) {}

  getChannelVideos(maxResults: number = 50): Observable<YouTubeVideo[]> {
    const url = `${this.BASE_URL}/search?part=snippet&channelId=${this.CHANNEL_ID}&maxResults=${maxResults}&order=date&type=video&key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      switchMap(response => {
        if (response.items && response.items.length > 0) {
          const videoIds = response.items.map((item: any) => item.id.videoId).join(',');
          return this.getVideoDetails(videoIds);
        }
        return of([]);
      }),
      catchError(error => {
        console.error('Error fetching YouTube videos:', error);
        return of([]);
      })
    );
  }

  private getVideoDetails(videoIds: string): Observable<YouTubeVideo[]> {
    const url = `${this.BASE_URL}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${this.API_KEY}`;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.items) {
          return response.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high.url,
            duration: this.parseDuration(item.contentDetails.duration),
            publishedAt: item.snippet.publishedAt,
            viewCount: parseInt(item.statistics.viewCount) || 0,
            likeCount: parseInt(item.statistics.likeCount) || 0,
            channelTitle: item.snippet.channelTitle
          }));
        }
        return [];
      }),
      catchError(error => {
        console.error('Error fetching video details:', error);
        return of([]);
      })
    );
  }

  private parseDuration(duration: string): string {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes) + Math.round(parseInt(seconds) / 60);
    return `${Math.floor(totalMinutes / 60)}:${(totalMinutes % 60).toString().padStart(2, '0')}`;
  }

  convertToProgram(youtubeVideo: YouTubeVideo): Program {
    return {
      id: youtubeVideo.id,
      title: youtubeVideo.title,
      description: youtubeVideo.description,
      categoryId: 1,
      languageId: 1,
      duration: this.durationToMinutes(youtubeVideo.duration),
      publishDate: new Date(youtubeVideo.publishedAt).toISOString().split('T')[0],
      youtubeVideoId: youtubeVideo.id,
      youtubeThumbnail: youtubeVideo.thumbnail,
      youtubeUrl: `https://www.youtube.com/watch?v=${youtubeVideo.id}`,
      videoType: this.detectVideoType(youtubeVideo.title, youtubeVideo.description),
      viewCount: youtubeVideo.viewCount,
      likeCount: youtubeVideo.likeCount,
      tags: this.extractTags(youtubeVideo.title, youtubeVideo.description),
      videoSource: 'youtube',
      contentType: 'video',
      status: 'published',
      isActive: true
    };
  }

  private detectCategory(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('podcast') || text.includes('بودكاست')) return 'Podcast';
    if (text.includes('documentary') || text.includes('وثائقي')) return 'Documentary';
    if (text.includes('lecture') || text.includes('محاضرة')) return 'Lecture';
    if (text.includes('interview') || text.includes('مقابلة')) return 'Interview';
    if (text.includes('discussion') || text.includes('نقاش')) return 'Discussion';
    
    return 'Other';
  }

  private detectLanguage(title: string, description: string): string {
    const text = title + ' ' + description;
    const arabicRegex = /[\u0600-\u06FF]/;
    
    if (arabicRegex.test(text)) {
      return 'Arabic';
    }
    return 'English';
  }

  private detectVideoType(title: string, description: string): 'podcast' | 'documentary' | 'lecture' | 'other' {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('podcast') || text.includes('بودكاست')) return 'podcast';
    if (text.includes('documentary') || text.includes('وثائقي')) return 'documentary';
    if (text.includes('lecture') || text.includes('محاضرة')) return 'lecture';
    
    return 'other';
  }

  private durationToMinutes(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  }

  private extractTags(title: string, description: string): string[] {
    const text = (title + ' ' + description).toLowerCase();
    const tags: string[] = [];
    
    if (text.includes('islam')) tags.push('Islam');
    if (text.includes('religion')) tags.push('Religion');
    if (text.includes('culture')) tags.push('Culture');
    if (text.includes('history')) tags.push('History');
    if (text.includes('philosophy')) tags.push('Philosophy');
    if (text.includes('education')) tags.push('Education');
    
    return tags;
  }
}
