import { Injectable, inject } from "@angular/core";
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError, BehaviorSubject } from "rxjs";
import { catchError, filter, take, switchMap } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token injection for unauthenticated auth endpoints
    if (this.isAuthEndpoint(req.url)) {
      return next.handle(req);
    }

    const token = this.authService.accessToken();
    const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !this.isRefreshing) {
          return this.handleTokenRefresh(req, next);
        }
        if (error.status === 401 && this.isRefreshing) {
          return this.refreshTokenSubject.pipe(
            filter((t) => t !== null),
            take(1),
            switchMap((newToken) => {
              return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }));
            }),
          );
        }
        return throwError(() => error);
      }),
    );
  }

  private isAuthEndpoint(url: string): boolean {
    // Only skip token for endpoints that don't need authentication
    const publicPaths = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/dev-login"];
    return publicPaths.some((p) => url.includes(p));
  }

  private handleTokenRefresh(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    return this.authService.refreshToken().pipe(
      switchMap((token) => {
        this.isRefreshing = false;
        this.refreshTokenSubject.next(token);
        return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
      }),
      catchError((err) => {
        this.isRefreshing = false;
        this.authService.logout();
        return throwError(() => err);
      }),
    );
  }
}
