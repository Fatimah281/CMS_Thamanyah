import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, CategoryResponseDto } from './dto/category.dto';
import { ApiResponseDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  async findAll(): Promise<ApiResponseDto<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.findAll();
    return {
      success: true,
      data: categories,
      message: 'Categories retrieved successfully',
    };
  }

  @Get('active')
  async findActive(): Promise<ApiResponseDto<CategoryResponseDto[]>> {
    const categories = await this.categoriesService.findActive();
    return {
      success: true,
      data: categories,
      message: 'Active categories retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<CategoryResponseDto>> {
    const category = await this.categoriesService.findOne(+id);
    return {
      success: true,
      data: category,
      message: 'Category retrieved successfully',
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(+id);
  }
}
