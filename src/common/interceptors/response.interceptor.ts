import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, map } from 'rxjs';

export interface EnvelopedResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  EnvelopedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<EnvelopedResponse<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Exclude Swagger routes from envelope wrapping
    if (request.url.startsWith('/api/docs')) {
      return next.handle() as unknown as Observable<EnvelopedResponse<T>>;
    }

    return next.handle().pipe(map((data: T) => ({ data })));
  }
}
