import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { FavoritesService } from "../services/favorites.service";
import { GamesService } from "../services/games.service";
import { LookupService } from "../services/lookup.service";
import { AuthService } from "../services/auth.service";
import { MasterGame, Genre } from "../types/game.types";

@Component({
  selector: "app-games-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="page-header">
      <h2>Games</h2>
      <p>All titles and their versions</p>
    </div>

    <!-- Filters -->
    <div class="explorer-filters">
      <div class="search-wrap">
        <span class="search-icon">🔍</span>
        <input
          class="search-input"
          type="text"
          placeholder="Search by title, series, alias..."
          [(ngModel)]="searchQuery"
          (input)="onSearch()"
        />
      </div>

      <div class="genre-chips">
        <button class="chip" [class.active]="!selectedGenre()" (click)="setGenre(null)">All</button>
        @for (g of genres(); track g.slug) {
          <button class="chip" [class.active]="selectedGenre() === g.slug" (click)="setGenre(g.slug)">
            {{ g.name }}
          </button>
        }
      </div>

      <div class="sort-row">
        <span class="sort-label">Sort:</span>
        <button class="chip" [class.active]="sort() === 'name'" (click)="setSort('name')">Name {{ order() === 'asc' ? '↑' : '↓' }}</button>
        <button class="chip" [class.active]="sort() === 'year'" (click)="setSort('year')">Year {{ order() === 'asc' ? '↑' : '↓' }}</button>
      </div>
    </div>

    <!-- Results -->
    <div class="result-count">{{ total() }} games</div>

    @if (loading()) {
      <div class="center-message"><div class="spinner"></div><p>Loading...</p></div>
    }

    <div class="grid">
      @for (game of games(); track game.id) {
        <article class="card" [routerLink]="game.slug ? ['/games', game.slug] : null" [class.no-link]="!game.slug" style="cursor:pointer">
          <div class="card-header">
            <div class="card-cover">
              @if (game.coverImageUrl) {
                <img [src]="game.coverImageUrl" [alt]="game.title" loading="lazy" width="80" height="112" />
              } @else {
                <img [src]="'https://picsum.photos/seed/' + game.id + '/80/112'" [alt]="game.title" loading="lazy" width="80" height="112" />
              }
            </div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ game.title }}</h3>
              <div class="card-meta">
                @for (g of game.genres ?? []; track g.slug) {
                  <span class="tag tag-genre">{{ g.name }}</span>
                }
                <span class="tag">{{ game.firstReleaseYear }}</span>
                @if (game.alternativeTitles.length) {
                  <span class="tag tag-muted">a.k.a. {{ game.alternativeTitles.join(", ") }}</span>
                }
              </div>
            </div>
            <button
              class="favorite-btn"
              [class.is-favorite]="isFavorite(game.id)"
              [attr.aria-label]="isFavorite(game.id) ? 'Remove' : 'Add to'"
              (click)="toggleFavorite(game.id, $event)"
            >{{ isFavorite(game.id) ? "♥" : "♡" }}</button>
          </div>
        </article>
      }
    </div>

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <div class="pagination">
        <button class="pagination-btn" [disabled]="page() === 1" (click)="goPage(page() - 1)">← Previous</button>
        <span class="pagination-info">Page {{ page() }} of {{ totalPages() }}</span>
        <button class="pagination-btn" [disabled]="page() >= totalPages()" (click)="goPage(page() + 1)">Next →</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .explorer-filters {
      background: var(--bg-secondary, #12121a);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .search-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--bg-tertiary);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 10px 16px;
    }
    .search-wrap:focus-within { border-color: var(--border-accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    .search-icon { font-size: 16px; flex-shrink: 0; }
    .search-input {
      flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit;
    }
    .search-input::placeholder { color: var(--text-muted); }

    .genre-chips, .sort-row { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .sort-label { font-size: 12px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-right: 4px; }

    .chip {
      padding: 4px 12px; border-radius: 20px; border: 1px solid var(--border-subtle);
      background: var(--bg-tertiary); color: var(--text-secondary); font-size: 12px; font-weight: 500;
      cursor: pointer; transition: all var(--transition-fast); font-family: inherit; white-space: nowrap;
    }
    .chip:hover { border-color: var(--border-default); color: var(--text-primary); }
    .chip.active { background: var(--accent-glow); color: var(--accent); border-color: var(--border-accent); }

    .result-count { font-size: 13px; color: var(--text-muted); margin-bottom: 16px; }

    .center-message { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: var(--text-muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesPageComponent implements OnInit {
  private favoritesService = inject(FavoritesService);
  private gamesService = inject(GamesService);
  private lookupService = inject(LookupService);
  private auth = inject(AuthService);

  games = signal<MasterGame[]>([]);
  genres = signal<Genre[]>([]);
  loading = signal(true);
  total = signal(0);
  totalPages = signal(1);
  page = signal(1);
  limit = 50;

  searchQuery = "";
  selectedGenre = signal<string | null>(null);
  sort = signal<"name" | "year">("name");
  order = signal<"asc" | "desc">("asc");

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.lookupService.getGenres().subscribe((genres) => this.genres.set(genres));
    const load = () => {
      if (this.auth.isLoggedIn()) { this.loadGames(); }
      else { setTimeout(load, 500); }
    };
    load();
  }

  loadGames(): void {
    this.loading.set(true);
    this.gamesService.getGames({
      search: this.searchQuery || undefined,
      genre: this.selectedGenre() ?? undefined,
      sort: this.sort(),
      order: this.order(),
      page: this.page(),
      limit: this.limit,
    }).subscribe({
      next: (res) => {
        this.games.set(res.data);
        this.total.set(res.meta?.total ?? 0);
        this.totalPages.set(res.meta?.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.loadGames(); }, 300);
  }

  setGenre(slug: string | null): void {
    this.selectedGenre.set(slug);
    this.page.set(1);
    this.loadGames();
  }

  setSort(s: "name" | "year"): void {
    if (this.sort() === s) {
      this.order.update((o) => o === "asc" ? "desc" : "asc");
    } else {
      this.sort.set(s);
      this.order.set("asc");
    }
    this.loadGames();
  }

  goPage(p: number): void { this.page.set(p); this.loadGames(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  isFavorite(gameId: number): boolean { return this.favoritesService.isFavorite(gameId); }

  toggleFavorite(gameId: number, event: Event): void {
    event.stopPropagation();
    this.favoritesService.toggle(gameId);
  }
}
