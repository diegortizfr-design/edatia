import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Error interno del servidor';

    let message: string;
    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      const obj = rawResponse as any;
      if (Array.isArray(obj.message)) {
        message = obj.message.join(', ');
      } else if (typeof obj.message === 'string') {
        message = obj.message;
      } else if (typeof obj.error === 'string') {
        message = obj.error;
      } else {
        message = JSON.stringify(rawResponse);
      }
    } else {
      message = 'Error inesperado';
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status}`);
    }

    response.status(status).json(errorResponse);
  }
}
