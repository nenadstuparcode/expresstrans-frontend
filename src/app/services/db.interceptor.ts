import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

@Injectable()
export class DbInterceptor implements HttpInterceptor {
  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const clonedReq: HttpRequest<any> = request.clone({
      headers: request.headers.append(
        'X-DB-ID',
        environment.defaultDb
      ),
    });

    return next.handle(clonedReq);
  }
}
