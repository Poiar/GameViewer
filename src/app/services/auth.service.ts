import { Injectable, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { ApiBaseService } from "./api-base.service";
import { AuthResponse, UserProfile } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class AuthService extends ApiBaseService {
  private readonly currentUser = signal<UserProfile | null>(null);
  private readonly accessTokenSignal = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isLoggedIn = signal(false);

  constructor(http: HttpClient) {
    super(http);
    // Defer to break circular dependency: AppComponent → AuthService → http → interceptor → AuthService
    setTimeout(() => this.tryRestoreSession());
  }

  accessToken(): string | null {
    return this.accessTokenSignal();
  }

  private tryRestoreSession(): void {
    // Try refresh first (cookie-based), then fall back to dev-login
    this.refreshToken().subscribe({
      next: () => this.fetchProfile().subscribe(),
      error: () => {
        this.devLogin();
      },
    });
  }

  private devLogin(): void {
    // Use raw fetch to avoid HttpClient interceptor chain timing issues in constructor
    fetch("/api/auth/dev-login", { method: "POST", credentials: "include" })
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          this.setSession(json.data);
          // Fetch the full profile now that we have a token
          this.fetchProfile().subscribe();
        }
      })
      .catch(() => console.debug("[Auth] dev-login unavailable"));
  }

  register(username: string, displayName: string, email: string, password: string): Observable<AuthResponse> {
    return this.extractData<AuthResponse>(
      this.post<AuthResponse>("/auth/register", { username, displayName, email, password }),
    ).pipe(tap((res) => this.setSession(res)));
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.extractData<AuthResponse>(this.post<AuthResponse>("/auth/login", { username, password })).pipe(
      tap((res) => this.setSession(res)),
    );
  }

  refreshToken(): Observable<string> {
    return this.extractData<{ accessToken: string }>(this.post<{ accessToken: string }>("/auth/refresh", {})).pipe(
      tap((res) => {
        this.accessTokenSignal.set(res.accessToken);
        this.isLoggedIn.set(true);
      }),
      this.extractAccessToken,
    );
  }

  logout(): void {
    this.post("/auth/logout", {}).subscribe();
    this.clearSession();
  }

  fetchProfile(): Observable<UserProfile> {
    return this.extractData<UserProfile>(this.get<UserProfile>("/auth/me")).pipe(
      tap((profile) => {
        this.currentUser.set(profile);
        this.isLoggedIn.set(true);
      }),
    );
  }

  updateProfile(displayName: string, email: string, currentPassword: string): Observable<UserProfile> {
    return this.extractData<UserProfile>(
      this.put<UserProfile>("/auth/me", { displayName, email, currentPassword }),
    ).pipe(tap((profile) => this.currentUser.set(profile)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.extractData<void>(this.put<void>("/auth/me/password", { currentPassword, newPassword }));
  }

  private setSession(res: AuthResponse): void {
    this.accessTokenSignal.set(res.accessToken);
    this.currentUser.set(res.user);
    this.isLoggedIn.set(true);
  }

  private clearSession(): void {
    this.accessTokenSignal.set(null);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }

  private extractAccessToken(source: Observable<{ accessToken: string }>): Observable<string> {
    return new Observable((subscriber) => {
      source.subscribe({
        next: (res) => {
          subscriber.next(res.accessToken);
          subscriber.complete();
        },
        error: (err) => subscriber.error(err),
      });
    });
  }
}
