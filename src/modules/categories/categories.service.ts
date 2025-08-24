import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(@Inject('FIRESTORE') private readonly db: Firestore) {}
  private col() { return this.db.collection('categories'); }
  private prog() { return this.db.collection('programs'); }
  private async nextId() {
    const ref = this.db.collection('_counters').doc('categories');
    return this.db.runTransaction(async tx => {
      const s = await tx.get(ref); const v = s.exists ? (s.data()!.value as number) : 0; const n = v + 1; tx.set(ref, { value: n }); return n; });
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const exists = await this.col().where('name', '==', dto.name).limit(1).get();
    if (!exists.empty) throw new ConflictException('Category name already exists');
    const id = await this.nextId();
    const doc = { id, name: dto.name, description: dto.description || null, isActive: true, sortOrder: dto.sortOrder || 0, createdAt: new Date(), updatedAt: new Date() };
    await this.col().doc(String(id)).set(doc as any);
    return this.map(doc as any);
  }

  async findAll(): Promise<CategoryResponseDto[]> {
    // TEMPORARILY AVOID COMPOSITE QUERY TO PREVENT INDEX ISSUE
    const snap = await this.col().orderBy('sortOrder','asc').get();
    const categories = await Promise.all(snap.docs.map(d => this.map(d.data() as any)));
    // Sort by name in memory instead of in query
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findActive(): Promise<CategoryResponseDto[]> {
    // TEMPORARILY AVOID COMPOSITE QUERY TO PREVENT INDEX ISSUE
    const snap = await this.col().where('isActive','==', true).orderBy('sortOrder','asc').get();
    const categories = await Promise.all(snap.docs.map(d => this.map(d.data() as any)));
    // Sort by name in memory instead of in query
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  async findOne(id: number): Promise<CategoryResponseDto> {
    const doc = await this.col().doc(String(id)).get();
    if (!doc.exists) throw new NotFoundException('Category not found');
    return this.map(doc.data() as any);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const ref = this.col().doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Category not found');
    if (dto.name) {
      const exists = await this.col().where('name','==',dto.name).limit(1).get();
      if (!exists.empty && (exists.docs[0].data() as any).id !== id) throw new ConflictException('Category name already exists');
    }
    await ref.update({ ...dto, updatedAt: new Date() } as any);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const ref = this.col().doc(String(id));
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundException('Category not found');
    const countSnap = await this.prog().where('categoryId','==', id).limit(1).get();
    if (!countSnap.empty) throw new BadRequestException('Cannot delete category with associated programs');
    await ref.delete();
  }

  private async map(c: any): Promise<CategoryResponseDto> {
    const countSnap = await this.prog().where('categoryId','==', c.id).count().get();
    const programCount = countSnap.data().count as number;
    return { id: c.id, name: c.name, description: c.description || undefined, isActive: c.isActive !== false, sortOrder: c.sortOrder || 0, createdAt: c.createdAt, updatedAt: c.updatedAt, programCount };
  }
}
