import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Agrega este log para ver el error real en consola
    console.error('GLOBAL EXCEPTION:', exception);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let details: any[] = [];

    // Errores HTTP estándar (NotFound, BadRequest, etc.)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        details = (res as any).details || [];
      }
    }

    // Errores ZodPipe
    else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Datos inválidos';
      details = exception.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
    }

    // Errores de Prisma (conocidos)
    else if (exception instanceof PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Ya existe un registro con ese dato único';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'El recurso no existe o fue eliminado';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Error de base de datos';
          break;
      }
    }

    // Prisma - errores desconocidos del motor
    else if (exception instanceof PrismaClientUnknownRequestError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error desconocido de base de datos';
    }

    // Otros errores (bug internos, null, etc.)
    else if (exception instanceof Error) {
      message = exception.message || message;
    }

    // Estructura final de respuesta
    response.status(status).json({
      statusCode: status,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
