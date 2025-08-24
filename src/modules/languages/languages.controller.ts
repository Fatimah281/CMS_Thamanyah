import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LanguagesService } from './languages.service';
import { CreateLanguageDto, UpdateLanguageDto, LanguageResponseDto } from './dto/language.dto';
import { ApiResponseDto } from '../../common/dto/pagination.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Languages')
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  create(@Body() createLanguageDto: CreateLanguageDto) {
    return this.languagesService.create(createLanguageDto);
  }

  @Get()
  async findAll(): Promise<ApiResponseDto<LanguageResponseDto[]>> {
    const languages = await this.languagesService.findAll();
    return {
      success: true,
      data: languages,
      message: 'Languages retrieved successfully',
    };
  }

  @Get('active')
  async findActive(): Promise<ApiResponseDto<LanguageResponseDto[]>> {
    const languages = await this.languagesService.findActive();
    return {
      success: true,
      data: languages,
      message: 'Active languages retrieved successfully',
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<LanguageResponseDto>> {
    const language = await this.languagesService.findOne(+id);
    return {
      success: true,
      data: language,
      message: 'Language retrieved successfully',
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateLanguageDto: UpdateLanguageDto) {
    return this.languagesService.update(+id, updateLanguageDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.languagesService.remove(+id);
  }
}
