import { Injectable, inject, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthService } from "./auth.service";

interface CoverData {
  id: number;
  title: string;
  slug: string;
  coverImageUrl: string | null;
}

@Injectable({ providedIn: "root" })
export class CoverService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly coverMap = signal<Record<string, string>>({});
  readonly covers = this.coverMap.asReadonly();
  private loaded = false;

  constructor() {
    // Load covers once auth is ready (deferred to break DI cycles)
    setTimeout(() => {
      if (this.auth.isLoggedIn()) this.loadCovers();
    }, 1000);
  }

  loadCovers(): void {
    if (this.loaded) return;

    this.http
      .get<{ data: CoverData[] }>("/api/games", {
        params: { limit: 2000, sort: "name", order: "asc" },
        withCredentials: true,
      })
      .subscribe({
        next: (res) => {
          const map: Record<string, string> = {};
          for (const game of res.data) {
            if (game.coverImageUrl) {
              map[game.title.toLowerCase()] = game.coverImageUrl;
            }
          }
          this.coverMap.set(map);
          this.loaded = true;
        },
      });
  }

  getCoverUrl(title: string): string | null {
    return this.coverMap()[title.toLowerCase()] ?? null;
  }
}
