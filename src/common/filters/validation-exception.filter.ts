import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(ValidationError)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ValidationError[], host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const validationErrors = this.flattenValidationErrors(exception);

    response.status(HttpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      timestamp: new Date().toISOString(),
    });
  }

  private flattenValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    errors.forEach(error => {
      if (error.constraints) {
        Object.values(error.constraints).forEach(constraint => {
          messages.push(constraint);
        });
      }

      if (error.children) {
        messages.push(...this.flattenValidationErrors(error.children));
      }
    });

    return messages;
  }
}
