import { Injectable } from "@angular/core";
import { HttpClient, HttpParams, HttpErrorResponse } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ApiResponse } from "../types/api.types";

@Injectable({ providedIn: "root" })
export class ApiBaseService {
  protected readonly baseUrl = "/api";

  constructor(protected http: HttpClient) {}

  protected get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          httpParams = httpParams.set(k, String(v));
        }
      });
    }
    return this.http
      .get<ApiResponse<T>>(`${this.baseUrl}${path}`, { params: httpParams, withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  protected post<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http
      .post<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  protected put<T>(path: string, body: unknown): Observable<ApiResponse<T>> {
    return this.http
      .put<ApiResponse<T>>(`${this.baseUrl}${path}`, body, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  protected delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http
      .delete<ApiResponse<T>>(`${this.baseUrl}${path}`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  protected extractData<T>(source: Observable<ApiResponse<T>>): Observable<T> {
    return source.pipe(map((res) => res.data));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const message = error.error?.error?.message ?? error.message ?? "An unexpected error occurred";
    return throwError(() => new Error(message));
  }
}
