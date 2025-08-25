import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Firestore, FieldValue } from 'firebase-admin/firestore';
import { CreateProgramDto, UpdateProgramDto, ProgramQueryDto, ProgramResponseDto, ContentType, VideoSource } from './dto/program.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';
import { RedisService } from '../redis/redis.service';

export enum ProgramStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Injectable()
export class ProgramsService {
  constructor(
    @Inject('FIRESTORE') private readonly db: Firestore,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly redisService: RedisService,
  ) {}

  private col(name: string) { return this.db.collection(name); }

  private async ensureRefExists(col: string, id: number, notFoundMsg: string) {
    const snap = await this.col(col).doc(String(id)).get();
    if (!snap.exists) throw new BadRequestException(notFoundMsg);
  }

  private async nextId(counter: string): Promise<number> {
    const ref = this.db.collection('_counters').doc(counter);
    
    return this.db.runTransaction(async tx => {
      const doc = await tx.get(ref);
      let currentValue = 0;
      
      if (doc.exists) {
        currentValue = (doc.data()!.value as number) || 0;
      }
      
      const nextValue = currentValue + 1;
      
      const programRef = this.col('programs').doc(String(nextValue));
      const programDoc = await tx.get(programRef);
      
      let finalValue = nextValue;
      if (programDoc.exists) {
        finalValue = nextValue + 1;
      }
      
      tx.set(ref, { value: finalValue, updatedAt: new Date() });
      
      return finalValue;
    });
  }

  async create(createDto: CreateProgramDto, uid: string, userRole: string): Promise<ProgramResponseDto> {
    if (userRole === 'viewer') throw new ForbiddenException('Viewers cannot create programs');

    await this.ensureRefExists('categories', createDto.categoryId, 'Category not found');
    await this.ensureRefExists('languages', createDto.languageId, 'Language not found');

    const id = await this.nextId('programs');
    const data = {
      id,
      title: createDto.title,
      description: createDto.description,
      duration: createDto.duration,
      publishDate: createDto.publishDate,
      status: createDto.status || ProgramStatus.DRAFT,
      thumbnailUrl: createDto.thumbnailUrl || null,
      videoUrl: createDto.videoUrl || null,
      audioUrl: createDto.audioUrl || null,
      viewCount: createDto.viewCount || 0,
      likeCount: createDto.likeCount || 0,
      isActive: createDto.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
      categoryId: createDto.categoryId,
      languageId: createDto.languageId,
      contentType: createDto.contentType || ContentType.VIDEO,
      videoSource: createDto.videoSource || VideoSource.YOUTUBE,
      youtubeUrl: createDto.youtubeUrl || null,
      youtubeVideoId: createDto.youtubeVideoId || null,
      youtubeThumbnail: createDto.youtubeThumbnail || null,
      uploadedVideoUrl: createDto.uploadedVideoUrl || null,
      videoType: createDto.videoType || 'other',
      tags: createDto.tags || [],
      fileSize: createDto.fileSize || null,
      fileName: createDto.fileName || null,
      createdBy: uid,
    };
    await this.col('programs').doc(String(id)).set(data as any);
    await this.clearProgramCache();
    return this.mapToResponseDto(data as any);
  }

  async findAll(query: ProgramQueryDto, pagination: PaginationDto, uid?: string, userRole?: string): Promise<PaginatedResponseDto<ProgramResponseDto>> {
    const cacheKey = `programs:list:${JSON.stringify({ query, pagination, userRole })}`;
    
    console.log(`🔍 [CACHE] Checking cache for key: ${cacheKey}`);

    const cached = await this.redisService.getJson<PaginatedResponseDto<ProgramResponseDto>>(cacheKey);
    if (cached) {
      console.log(`✅ [CACHE] HIT - Data found in Redis cache for key: ${cacheKey}`);
      console.log(`📊 [CACHE] Returning ${cached.data?.length || 0} programs from cache`);
      
      const programsWithSource = cached.data.map(program => ({
        ...program,
        source: 'Redis'
      }));
      return {
        ...cached,
        data: programsWithSource
      };
    }

    console.log(`❌ [CACHE] MISS - No data found in Redis cache for key: ${cacheKey}`);
    console.log(`🗄️ [DB] Fetching data from Firestore database...`);

    let q: FirebaseFirestore.Query = this.col('programs');

    if (userRole !== 'admin' && userRole !== 'editor') {
      q = q.where('status', '==', ProgramStatus.PUBLISHED);
    }

    if (query.categoryId !== undefined && query.categoryId !== null) {
      q = q.where('categoryId', '==', query.categoryId);
    }

    if (query.languageId !== undefined && query.languageId !== null) {
      q = q.where('languageId', '==', query.languageId);
    }

    if (query.status !== undefined && query.status !== null) {
      q = q.where('status', '==', query.status);
    }

    if (query.contentType !== undefined && query.contentType !== null) {
      q = q.where('contentType', '==', query.contentType);
    }

    if (query.videoSource !== undefined && query.videoSource !== null) {
      q = q.where('videoSource', '==', query.videoSource);
    }

    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as any) || 'DESC';
    q = q.orderBy(sortBy, sortOrder === 'ASC' ? 'asc' : 'desc');

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const offset = (page - 1) * limit;
    q = q.offset(offset).limit(limit);

    try {
      const snap = await q.get();
      
      const docs = snap.docs.map(d => d.data());

      let countQuery: FirebaseFirestore.Query = this.col('programs');
      
      if (userRole !== 'admin' && userRole !== 'editor') {
        countQuery = countQuery.where('status', '==', ProgramStatus.PUBLISHED);
      }
      if (query.categoryId !== undefined && query.categoryId !== null) {
        countQuery = countQuery.where('categoryId', '==', query.categoryId);
      }
      if (query.languageId !== undefined && query.languageId !== null) {
        countQuery = countQuery.where('languageId', '==', query.languageId);
      }
      if (query.status !== undefined && query.status !== null) {
        countQuery = countQuery.where('status', '==', query.status);
      }
      if (query.contentType !== undefined && query.contentType !== null) {
        countQuery = countQuery.where('contentType', '==', query.contentType);
      }
      if (query.videoSource !== undefined && query.videoSource !== null) {
        countQuery = countQuery.where('videoSource', '==', query.videoSource);
      }

      const countSnap = await countQuery.get();
      const total = countSnap.docs.length;

      const mappedData = await Promise.all(docs.map(async (d, index) => {
        try {
          const mapped = await this.mapToResponseDto(d as any);
          return mapped;
        } catch (error) {
          return {
            id: d.id,
            title: d.title || 'Error Loading Program',
            description: d.description || 'This program could not be loaded properly.',
            duration: d.duration || 0,
            publishDate: d.publishDate || d.createdAt || new Date(),
            status: d.status || ProgramStatus.DRAFT,
            thumbnailUrl: undefined,
            videoUrl: undefined,
            audioUrl: undefined,
            viewCount: d.viewCount || 0,
            likeCount: d.likeCount || 0,
            isActive: false,
            createdAt: d.createdAt || new Date(),
            updatedAt: d.updatedAt || d.createdAt || new Date(),
            category: { id: null, name: 'Error Loading Category' },
            language: { id: null, name: 'Error Loading Language', code: '' },
            contentType: ContentType.VIDEO,
            videoSource: VideoSource.YOUTUBE,
            youtubeVideoId: undefined,
            youtubeThumbnail: undefined,
            uploadedVideoUrl: undefined,
            videoType: 'other',
            tags: [],
            fileSize: undefined,
            fileName: undefined,
            createdBy: { id: 'unknown', username: 'Unknown User' },
            metadata: [],
          };
        }
      }));

      const validMappedData = mappedData.filter(item => item !== null && item !== undefined);

      const result: PaginatedResponseDto<ProgramResponseDto> = {
        data: validMappedData.map(program => ({
          ...program,
          source: 'Database'
        })),
        meta: {
          page, 
          limit, 
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };

      await this.redisService.setJson(cacheKey, result, 300);

      return result;

    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number, uid?: string, userRole?: string): Promise<ProgramResponseDto> {
    const cacheKey = `program:${id}`;
    
    const cached = await this.redisService.getJson<ProgramResponseDto>(cacheKey);
    if (cached) {
      if (userRole !== 'admin' && userRole !== 'editor' && cached.status !== ProgramStatus.PUBLISHED) {
        throw new NotFoundException('Program not found');
      }
      return { ...cached, source: 'Redis' } as any;
    }

    const doc = await this.col('programs').doc(String(id)).get();
    if (!doc.exists) throw new NotFoundException('Program not found');
    const data = doc.data() as any;
    if (userRole !== 'admin' && userRole !== 'editor' && data.status !== ProgramStatus.PUBLISHED) {
      throw new NotFoundException('Program not found');
    }
    const result = await this.mapToResponseDto(data);
    
    await this.redisService.setJson(cacheKey, result, 3600);
    return { ...result, source: 'Database' } as any;
  }

  async update(id: number, dto: UpdateProgramDto, uid: string, userRole: string): Promise<ProgramResponseDto> {
    const ref = this.col('programs').doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Program not found');
    const current = snap.data() as any;

    if (userRole === 'viewer') throw new ForbiddenException('Viewers cannot update programs');
    if (userRole === 'editor' && current.createdBy !== uid) throw new ForbiddenException('You can only update your own programs');

    const updateData = {
      ...dto,
      updatedAt: new Date()
    };

    await ref.update(updateData as any);
    await this.clearProgramCache();
    const updated = (await ref.get()).data() as any;
    return this.mapToResponseDto(updated);
  }

  async remove(id: number, uid: string, userRole: string): Promise<void> {
    const ref = this.col('programs').doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Program not found');
    const data = snap.data() as any;

    if (userRole === 'viewer') throw new ForbiddenException('Viewers cannot delete programs');
    if (userRole === 'editor' && data.createdBy !== uid) throw new ForbiddenException('You can only delete your own programs');

    await ref.delete();
    await this.clearProgramCache();
  }

  async search(searchTerm: string, pagination: PaginationDto, uid?: string, ipAddress?: string, userAgent?: string): Promise<PaginatedResponseDto<ProgramResponseDto>> {
    await this.col('search_logs').add({ searchTerm, userId: uid || null, ipAddress: ipAddress || null, userAgent: userAgent || null, timestamp: new Date() });

    const cacheKey = `programs:search:${searchTerm}:${JSON.stringify(pagination)}`;
    
    const cached = await this.redisService.getJson<PaginatedResponseDto<ProgramResponseDto>>(cacheKey);
    if (cached) {
      const programsWithSource = cached.data.map(program => ({
        ...program,
        source: 'Redis'
      }));
      return {
        ...cached,
        data: programsWithSource
      };
    }

    let q: FirebaseFirestore.Query = this.col('programs').where('status', '==', ProgramStatus.PUBLISHED).orderBy('createdAt', 'desc').limit(200);
    const snap = await q.get();
    const all = snap.docs.map(d => d.data() as any);
    const filtered = all.filter(p => (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (p.description || '').toLowerCase().includes(searchTerm.toLowerCase()));

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const start = (page - 1) * limit;
    const slice = filtered.slice(start, start + limit);

    const result = {
      data: await Promise.all(slice.map(d => this.mapToResponseDto(d))),
      meta: {
        page, limit, total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
        hasNext: page * limit < filtered.length,
        hasPrev: page > 1,
      },
    };

    await this.redisService.setJson(cacheKey, result, 180);

    return {
      ...result,
      data: result.data.map(program => ({
        ...program,
        source: 'Database'
      }))
    };
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.col('programs').doc(String(id)).update({ viewCount: FieldValue.increment(1) });
  }

  private async mapToResponseDto(p: any): Promise<ProgramResponseDto> {
    try {
      let userDoc = null;
      try {
        if (p.createdBy !== undefined && p.createdBy !== null) {
          const userSnap = await this.col('user_profiles').doc(String(p.createdBy)).get();
          userDoc = userSnap.exists ? userSnap.data() : null;
        }
      } catch (error) {
        userDoc = null;
      }

      const createdBy = p.createdBy || 'unknown';

      let metadataSnap = { docs: [] };
      try {
        if (p.id !== undefined && p.id !== null) {
          metadataSnap = await this.col('metadata').where('programId', '==', p.id).get();
        }
      } catch (error) {
        metadataSnap = { docs: [] };
      }

      let categoryDoc = null;
      try {
        if (p.categoryId !== undefined && p.categoryId !== null) {
          const categorySnap = await this.col('categories').doc(String(p.categoryId)).get();
          categoryDoc = categorySnap.exists ? categorySnap.data() : null;
        }
      } catch (error) {
        categoryDoc = null;
      }
      
      let languageDoc = null;
      try {
        if (p.languageId !== undefined && p.languageId !== null) {
          const languageSnap = await this.col('languages').doc(String(p.languageId)).get();
          languageDoc = languageSnap.exists ? languageSnap.data() : null;
        }
      } catch (error) {
        languageDoc = null;
      }

      const result: ProgramResponseDto = {
        id: p.id,
        title: p.title || 'Untitled Program',
        description: p.description || '',
        duration: p.duration || 0,
        publishDate: p.publishDate || p.createdAt || new Date(),
        status: p.status || ProgramStatus.DRAFT,
        thumbnailUrl: p.thumbnailUrl || p.youtubeThumbnail || undefined,
        videoUrl: p.videoUrl || p.youtubeUrl || p.uploadedVideoUrl || undefined,
        audioUrl: p.audioUrl || undefined,
        viewCount: p.viewCount || 0,
        likeCount: p.likeCount || 0,
        isActive: p.isActive !== false,
        createdAt: p.createdAt || new Date(),
        updatedAt: p.updatedAt || p.createdAt || new Date(),
        category: { 
          id: p.categoryId || null, 
          name: categoryDoc ? (categoryDoc as any).name : 'Unknown Category' 
        },
        language: { 
          id: p.languageId || null, 
          name: languageDoc ? (languageDoc as any).name : 'Unknown Language', 
          code: languageDoc ? (languageDoc as any).code || '' : '' 
        },
        contentType: p.contentType || ContentType.VIDEO,
        videoSource: p.videoSource || VideoSource.YOUTUBE,
        youtubeVideoId: p.youtubeVideoId || undefined,
        youtubeThumbnail: p.youtubeThumbnail || undefined,
        uploadedVideoUrl: p.uploadedVideoUrl || undefined,
        videoType: p.videoType || 'other',
        tags: p.tags || [],
        fileSize: p.fileSize || undefined,
        fileName: p.fileName || undefined,
        createdBy: { 
          id: createdBy, 
          username: userDoc ? (userDoc as any).username : 'Unknown User' 
        },
        metadata: metadataSnap.docs.map(d => ({ 
          key: (d.data() as any).key || 'unknown', 
          value: (d.data() as any).value || '' 
        })),
      };

      return result;
    } catch (error) {
      return {
        id: p.id,
        title: p.title || 'Error Loading Program',
        description: p.description || 'This program could not be loaded properly.',
        duration: p.duration || 0,
        publishDate: p.publishDate || p.createdAt || new Date(),
        status: p.status || ProgramStatus.DRAFT,
        thumbnailUrl: undefined,
        videoUrl: undefined,
        audioUrl: undefined,
        viewCount: p.viewCount || 0,
        likeCount: p.likeCount || 0,
        isActive: false,
        createdAt: p.createdAt || new Date(),
        updatedAt: p.updatedAt || p.createdAt || new Date(),
        category: { id: null, name: 'Error Loading Category' },
        language: { id: null, name: 'Error Loading Language', code: '' },
        contentType: ContentType.VIDEO,
        videoSource: VideoSource.YOUTUBE,
        youtubeVideoId: undefined,
        youtubeThumbnail: undefined,
        uploadedVideoUrl: undefined,
        videoType: 'other',
        tags: [],
        fileSize: undefined,
        fileName: undefined,
        createdBy: { id: 'unknown', username: 'Unknown User' },
        metadata: [],
      };
    }
  }

  private async clearProgramCache(): Promise<void> {
    await this.redisService.clearKeysByPrefix('cms:program:');
    
    const keys = await (this.cacheManager as any).store.keys('programs:*');
    if (keys?.length) await Promise.all(keys.map((k: string) => this.cacheManager.del(k)));
  }
}
