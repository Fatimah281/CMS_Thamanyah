import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Min, Length } from 'class-validator';

export class CreateLanguageDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @Length(2, 5)
  code: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateLanguageDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @Length(2, 5)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class LanguageResponseDto {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  programCount?: number;
}
