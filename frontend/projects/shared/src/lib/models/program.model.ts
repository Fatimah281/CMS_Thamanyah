export interface Program {
  id: string | number;
  title: string;
  description: string;
  categoryId?: number;
  languageId?: number;
  duration: number;
  publishDate: string;
  createdAt?: Date | { _seconds: number; _nanoseconds: number };
  updatedAt?: Date | { _seconds: number; _nanoseconds: number };
  category?: { id: number; name: string };
  language?: { id: number; name: string; code?: string };
  youtubeVideoId?: string;
  youtubeThumbnail?: string;
  youtubeUrl?: string;
  videoType?: 'podcast' | 'documentary' | 'lecture' | 'other';
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
  videoUrl?: string;
  uploadedVideoUrl?: string;
  videoSource?: 'youtube' | 'upload' | 'external';
  contentType?: 'video' | 'podcast';
  fileSize?: number;
  fileName?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  isActive?: boolean;
  createdBy?: string | { id: string; username: string };
  metadata?: Array<{ key: string; value: string }>;
}

export interface ProgramFormData {
  title: string;
  description: string;
  categoryId?: number;
  languageId?: number;
  duration?: number;
  publishDate?: string;
  youtubeVideoId?: string;
  videoType?: 'podcast' | 'documentary' | 'lecture' | 'other';
  tags?: string[];
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  contentType?: 'video' | 'podcast';
  videoSource?: 'youtube' | 'upload' | 'external';
  videoFile?: File;
  status?: 'draft' | 'published' | 'archived';
  isActive?: boolean;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  channelTitle: string;
}

export interface VideoUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  duration?: number;
}
