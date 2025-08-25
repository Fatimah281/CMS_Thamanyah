import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateLanguageDto, UpdateLanguageDto, LanguageResponseDto } from './dto/language.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LanguagesService {
  constructor(
    @Inject('FIRESTORE') private readonly db: Firestore,
    private readonly redisService: RedisService,
  ) {}
  private col() { return this.db.collection('languages'); }
  private prog() { return this.db.collection('programs'); }
  private async nextId() { const ref = this.db.collection('_counters').doc('languages'); return this.db.runTransaction(async tx => { const s = await tx.get(ref); const v = s.exists ? (s.data()!.value as number) : 0; const n = v + 1; tx.set(ref,{value:n}); return n; }); }

  async create(dto: CreateLanguageDto): Promise<LanguageResponseDto> {
    const exists = await this.col().where('name','==',dto.name).limit(1).get();
    const codeExists = await this.col().where('code','==',dto.code).limit(1).get();
    if (!exists.empty || !codeExists.empty) throw new ConflictException('Language name or code already exists');
    const id = await this.nextId();
    const doc = { id, name: dto.name, code: dto.code, isActive: true, sortOrder: dto.sortOrder || 0, createdAt: new Date(), updatedAt: new Date() };
    await this.col().doc(String(id)).set(doc as any);
    await this.clearLanguageCache();
    return this.map(doc as any);
  }

  async findAll(): Promise<LanguageResponseDto[]> {
    const cacheKey = 'languages:all';
    
    const cached = await this.redisService.getJson<LanguageResponseDto[]>(cacheKey);
    if (cached) {
      return cached.map(language => ({
        ...language,
        source: 'Redis'
      }));
    }

    const snap = await this.col().orderBy('sortOrder','asc').get();
    const languages = await Promise.all(snap.docs.map(d => this.map(d.data() as any)));
    const result = languages.sort((a, b) => a.name.localeCompare(b.name));
    
    await this.redisService.setJson(cacheKey, result, 3600);
    
    return result.map(language => ({
      ...language,
      source: 'Database'
    }));
  }

  async findActive(): Promise<LanguageResponseDto[]> {
    const cacheKey = 'languages:active';
    
    const cached = await this.redisService.getJson<LanguageResponseDto[]>(cacheKey);
    if (cached) {
      return cached.map(language => ({
        ...language,
        source: 'Redis'
      }));
    }

    const snap = await this.col().where('isActive','==', true).orderBy('sortOrder','asc').get();
    const languages = await Promise.all(snap.docs.map(d => this.map(d.data() as any)));
    const result = languages.sort((a, b) => a.name.localeCompare(b.name));
    
    await this.redisService.setJson(cacheKey, result, 3600);
    
    return result.map(language => ({
      ...language,
      source: 'Database'
    }));
  }

  async findOne(id: number): Promise<LanguageResponseDto> {
    const cacheKey = `language:${id}`;
    
    const cached = await this.redisService.getJson<LanguageResponseDto>(cacheKey);
    if (cached) {
      return { ...cached, source: 'Redis' } as any;
    }

    const doc = await this.col().doc(String(id)).get();
    if (!doc.exists) throw new NotFoundException('Language not found');
    const result = await this.map(doc.data() as any);
    
    await this.redisService.setJson(cacheKey, result, 3600);
    
    return { ...result, source: 'Database' } as any;
  }

  async update(id: number, dto: UpdateLanguageDto): Promise<LanguageResponseDto> {
    const ref = this.col().doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Language not found');
    if (dto.name || dto.code) {
      if (dto.name) {
        const n = await this.col().where('name','==',dto.name).limit(1).get();
        if (!n.empty && (n.docs[0].data() as any).id !== id) throw new ConflictException('Language name or code already exists');
      }
      if (dto.code) {
        const c = await this.col().where('code','==',dto.code).limit(1).get();
        if (!c.empty && (c.docs[0].data() as any).id !== id) throw new ConflictException('Language name or code already exists');
      }
    }
    await ref.update({ ...dto, updatedAt: new Date() } as any);
    await this.clearLanguageCache();
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const ref = this.col().doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Language not found');
    const countSnap = await this.prog().where('languageId','==', id).limit(1).get();
    if (!countSnap.empty) throw new BadRequestException('Cannot delete language with associated programs');
    await ref.delete();
    await this.clearLanguageCache();
  }

  private async clearLanguageCache(): Promise<void> {
    await this.redisService.clearKeysByPrefix('cms:language:');
    await this.redisService.clearKeysByPrefix('cms:languages:');
  }

  private async map(l: any): Promise<LanguageResponseDto> {
    const countSnap = await this.prog().where('languageId','==', l.id).count().get();
    const programCount = countSnap.data().count as number;
    return { id: l.id, name: l.name, code: l.code, isActive: l.isActive !== false, sortOrder: l.sortOrder || 0, createdAt: l.createdAt, updatedAt: l.updatedAt, programCount };
  }
}
