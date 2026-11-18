import { Catch, ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, _host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      const error = exception.getError();
      if (typeof error === 'string') return { status: 'error', message: error };
      if (typeof error === 'object' && error !== null && 'message' in error) {
        return { status: 'error', message: String((error as { message: unknown }).message) };
      }
      return { status: 'error', message: String(error) };
    }

    // Las excepciones HTTP de Nest (BadRequest, Forbidden, NotFound…) viajan con
    // su código para que el gateway responda lo mismo sin adivinar por el texto.
    if (exception instanceof HttpException) {
      return { status: 'error', message: exception.message, statusCode: exception.getStatus() };
    }
    if (exception instanceof Error) {
      return { status: 'error', message: exception.message };
    }

    return { status: 'error', message: 'Internal server error' };
  }
}
