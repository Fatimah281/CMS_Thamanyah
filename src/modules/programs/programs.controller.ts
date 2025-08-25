import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto, ProgramQueryDto, ProgramResponseDto, ProgramStatus, ContentType, VideoSource } from './dto/program.dto';
import { PaginationDto, PaginatedResponseDto } from '../../common/dto/pagination.dto';

@ApiTags('Programs')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Upload a video file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Video uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file' })
  async uploadVideo(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only video files are allowed.');
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 500MB.');
    }

    try {
      const uploadResult = {
        url: `/uploads/videos/${file.filename}`,
        fileName: file.originalname,
        fileSize: file.size,
        mimetype: file.mimetype
      };
      
      return {
        success: true,
        message: 'Video uploaded successfully',
        data: uploadResult,
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload video: ' + error.message);
    }
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'content_creator')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new program' })
  @ApiResponse({ status: 201, description: 'Program created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Body() createProgramDto: CreateProgramDto, @Request() req) {
    const user = req.user;
    const uid = user.uid;
    const userRole = user.role;
    
    const program = await this.programsService.create(createProgramDto, uid, userRole);
    return {
      success: true,
      message: 'Program created successfully',
      data: program,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all programs with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status', enum: ProgramStatus })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'languageId', required: false, description: 'Filter by language ID' })
  @ApiQuery({ name: 'contentType', required: false, description: 'Filter by content type', enum: ContentType })
  @ApiQuery({ name: 'videoSource', required: false, description: 'Filter by video source', enum: VideoSource })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order (ASC/DESC, default: DESC)' })
  @ApiResponse({ status: 200, description: 'Programs retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async findAll(@Query() query: any, @Request() req) {
    const pagination: PaginationDto = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    };

    const programQuery: ProgramQueryDto = {
      status: query.status,
      categoryId: query.categoryId ? parseInt(query.categoryId) : undefined,
      languageId: query.languageId ? parseInt(query.languageId) : undefined,
      contentType: query.contentType,
      videoSource: query.videoSource,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'DESC',
    };

    const result = await this.programsService.findAll(programQuery, pagination, undefined, 'viewer');
    return {
      success: true,
      message: 'Programs retrieved successfully',
      data: result.data,
      pagination: result.meta,
    };
  }

  @Get('search')
  @ApiOperation({ summary: 'Search programs' })
  @ApiQuery({ name: 'search', required: true, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async search(@Query() query: any, @Request() req) {
    
    const pagination: PaginationDto = {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
    };

    const result = await this.programsService.search(query.search, pagination, req.ip, req.headers['user-agent']);
    return {
      success: true,
      message: 'Search results retrieved successfully',
      data: result.data,
      pagination: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a program by ID' })
  @ApiResponse({ status: 200, description: 'Program retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const program = await this.programsService.findOne(parseInt(id), undefined, 'viewer');
    return {
      success: true,
      message: 'Program retrieved successfully',
      data: program,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a program' })
  @ApiResponse({ status: 200, description: 'Program updated successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async update(
    @Param('id') id: string,
    @Body() updateProgramDto: UpdateProgramDto,
    @Request() req,
  ) {
    const program = await this.programsService.update(parseInt(id), updateProgramDto, 'system', 'admin');
    return {
      success: true,
      message: 'Program updated successfully',
      data: program,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a program' })
  @ApiResponse({ status: 204, description: 'Program deleted successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.programsService.remove(parseInt(id), 'system', 'admin');
    return {
      success: true,
      message: 'Program deleted successfully',
    };
  }

  @Post(':id/increment-view')
  @ApiOperation({ summary: 'Increment program view count' })
  @ApiResponse({ status: 200, description: 'View count incremented successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async incrementViewCount(@Param('id') id: string) {
    await this.programsService.incrementViewCount(parseInt(id));
    return {
      success: true,
      message: 'View count incremented successfully',
    };
  }
}
