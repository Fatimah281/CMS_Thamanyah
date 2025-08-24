import { IsString, IsNotEmpty, IsInt, Min, IsDate, IsOptional, IsUrl, IsEnum, IsArray, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProgramStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ContentType {
  VIDEO = 'video',
  PODCAST = 'podcast'
}

export enum VideoSource {
  YOUTUBE = 'youtube',
  UPLOAD = 'upload',
  EXTERNAL = 'external'
}

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  publishDate?: string; // Format: "2024-01-25"

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  languageId?: number;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(VideoSource)
  videoSource?: VideoSource;

  @IsOptional()
  
  videoUrl?: string;

  @IsOptional()
  
  audioUrl?: string;

  @IsOptional()
  
  thumbnailUrl?: string;

  @IsOptional()
  
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  youtubeVideoId?: string;

  @IsOptional()
  
  youtubeThumbnail?: string;

  @IsOptional()
  
  uploadedVideoUrl?: string;

  @IsOptional()
  @IsString()
  videoType?: 'podcast' | 'documentary' | 'lecture' | 'other';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  viewCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  likeCount?: number;

  @IsOptional()
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  publishDate?: string; // Format: "2024-01-25"

  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  languageId?: number;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(VideoSource)
  videoSource?: VideoSource;

  @IsOptional()
  videoUrl?: string;

  @IsOptional()
  audioUrl?: string;

  @IsOptional()
  thumbnailUrl?: string;

  @IsOptional()
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  youtubeVideoId?: string;

  @IsOptional()
  youtubeThumbnail?: string;

  @IsOptional()
  uploadedVideoUrl?: string;

  @IsOptional()
  @IsString()
  videoType?: 'podcast' | 'documentary' | 'lecture' | 'other';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  viewCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  likeCount?: number;

  @IsOptional()
  @IsInt()
  fileSize?: number;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

export class ProgramQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsOptional()
  @IsInt()
  languageId?: number;

  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(VideoSource)
  videoSource?: VideoSource;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class ProgramResponseDto {
  id: number;
  title: string;
  description: string;
  duration: number;
  publishDate: Date;
  status: ProgramStatus;
  thumbnailUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  viewCount: number;
  likeCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
  };
  language: {
    id: number;
    name: string;
    code: string;
  };
  contentType: ContentType;
  videoSource: VideoSource;
  youtubeVideoId?: string;
  youtubeThumbnail?: string;
  uploadedVideoUrl?: string;
  videoType?: string;
  tags?: string[];
  fileSize?: number;
  fileName?: string;
  createdBy: {
    id: string;
    username: string;
  };
  metadata?: Array<{
    key: string;
    value: string;
  }>;
}
