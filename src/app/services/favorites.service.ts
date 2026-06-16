import { Injectable, signal, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ApiBaseService } from "./api-base.service";
import { AuthService } from "./auth.service";
import { MasterGame } from "../types/game.types";

@Injectable({ providedIn: "root" })
export class FavoritesService extends ApiBaseService {
  private authService = inject(AuthService);
  favorites = signal<Set<number>>(new Set());

  constructor(http: HttpClient) {
    super(http);
  }

  loadFavorites(): void {
    if (!this.authService.isLoggedIn()) return;
    this.extractData<MasterGame[]>(this.get<MasterGame[]>("/favorites")).subscribe({
      next: (games) => this.favorites.set(new Set(games.map((g) => g.id))),
    });
  }

  toggle(gameId: number): void {
    this.favorites.update((set) => {
      const next = new Set(set);
      if (next.has(gameId)) {
        next.delete(gameId);
        this.delete<void>(`/favorites/${gameId}`).subscribe();
      } else {
        next.add(gameId);
        this.post<void>(`/favorites/${gameId}`, {}).subscribe();
      }
      return next;
    });
  }

  isFavorite(gameId: number): boolean {
    return this.favorites().has(gameId);
  }
}
