import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl } = request;
    
    // Extract or generate correlationId
    const correlationId = request.headers['x-correlation-id'] || randomUUID();
    const tenantId = request.headers['x-tenant-id'] || 'system';
    
    request.correlationId = correlationId;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const contentLength = response.get('content-length') || 0;
          this.logger.log(
            `[${correlationId}] [Tenant: ${tenantId}] ${method} ${originalUrl} ${statusCode} ${contentLength} - ${Date.now() - startTime}ms`
          );
        },
        error: (err) => {
          const statusCode = err.status || 500;
          this.logger.error(
            `[${correlationId}] [Tenant: ${tenantId}] ${method} ${originalUrl} ${statusCode} - ${Date.now() - startTime}ms - Error: ${err.message}`
          );
        }
      }),
    );
  }
}
