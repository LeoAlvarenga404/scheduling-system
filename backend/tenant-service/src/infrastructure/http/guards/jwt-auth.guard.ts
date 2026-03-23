import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    // In a real microservices ecosystem, this might validate a JWT or expect the API Gateway
    // to have already validated it and passed the user context in headers.
    // For this implementation, we simply check for the presence of the header or a specific x-user-id.
    const userId = request.headers['x-user-id'];
    const role = request.headers['x-user-role'];

    if (!authHeader && !userId) {
      throw new UnauthorizedException('Missing authentication token or user context');
    }

    // Attach user to request for further use in controllers/guards
    request.user = {
      id: userId || 'anonymous',
      role: role || 'user',
      tenantId: request.headers['x-tenant-id'] || null,
    };

    return true;
  }
}
