import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { FavoritesService } from "../services/favorites.service";
import { GamesService } from "../services/games.service";
import { AuthService } from "../services/auth.service";
import { MasterGame } from "../types/game.types";

@Component({
  selector: "app-games-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Games</h2>
      <p>All titles and their versions</p>
    </div>
    @if (loading()) {
      <div class="center-message">
        <div class="spinner"></div>
        <p>Loading games...</p>
      </div>
    }
    <div class="grid">
      @for (game of games(); track game.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-cover">
              @if (game.coverImageUrl) {
                <img [src]="game.coverImageUrl" [alt]="game.title" loading="lazy" width="80" height="112" />
              } @else {
                <img
                  [src]="'https://picsum.photos/seed/' + game.id + '/80/112'"
                  [alt]="game.title"
                  loading="lazy"
                  width="80"
                  height="112"
                />
              }
            </div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ game.title }}</h3>
              <div class="card-meta">
                <span class="tag tag-genre">{{ names(game.genres) }}</span>
                <span class="tag">{{ game.firstReleaseYear }}</span>
                @if (game.alternativeTitles.length) {
                  <span class="tag tag-muted">a.k.a. {{ game.alternativeTitles.join(", ") }}</span>
                }
              </div>
            </div>
            <button
              class="favorite-btn"
              [class.is-favorite]="isFavorite(game.id)"
              [attr.aria-label]="isFavorite(game.id) ? 'Remove from favorites' : 'Add to favorites'"
              (click)="toggleFavorite(game.id, $event)"
              title="{{ isFavorite(game.id) ? 'Remove from' : 'Add to' }} favorites"
            >
              {{ isFavorite(game.id) ? "♥" : "♡" }}
            </button>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    .center-message { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: var(--text-muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesPageComponent implements OnInit {
  private favoritesService = inject(FavoritesService);
  private gamesService = inject(GamesService);
  private auth = inject(AuthService);

  games = signal<MasterGame[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    // Wait for auth then load
    const load = () => {
      if (this.auth.isLoggedIn()) {
        this.gamesService.getGames({ limit: 500, sort: "name" }).subscribe({
          next: (res) => {
            this.games.set(res.data);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      } else {
        setTimeout(load, 500);
      }
    };
    load();
  }

  names(arr?: Array<{ name: string }>): string {
    return arr?.map((g) => g.name).join(", ") ?? "";
  }

  isFavorite(gameId: number): boolean {
    return this.favoritesService.isFavorite(gameId);
  }

  toggleFavorite(gameId: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(gameId);
  }
}
