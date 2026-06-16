import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { SeriesService } from "../services/series.service";
import { AuthService } from "../services/auth.service";
import { Series } from "../types/game.types";

@Component({
  selector: "app-series-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="s-header">
      <div class="sh-left">
        <h2>Series</h2>
        <p>{{ total() }} franchises in the catalog</p>
      </div>
      <div class="sh-stat">
        <span class="sh-val">{{ total() }}</span>
        <span class="sh-lbl">Series</span>
      </div>
    </div>

    <div class="s-bar">
      <div class="s-search">
        <svg class="ss-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input class="ss-input" type="text" placeholder="Search series..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        @if (searchQuery) {
          <button class="ss-clear" (click)="searchQuery=''; onSearch()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        }
      </div>
      <div class="s-sort">
        <button class="s-chip" [class.on]="sort() === 'name'" (click)="toggleSort('name')">
          Name @if (sort() === 'name') { {{ order() === 'asc' ? '↑' : '↓' }} }
        </button>
        <button class="s-chip" [class.on]="sort() === 'games'" (click)="toggleSort('games')">
          Games @if (sort() === 'games') { {{ order() === 'asc' ? '↑' : '↓' }} }
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="skel-grid">
        @for (i of [0,1,2,3,4,5]; track i) {
          <div class="skel-card"><div class="skel-cover"></div><div class="skel-info"><div class="skel-l skel-l--t"></div><div class="skel-l skel-l--m"></div></div></div>
        }
      </div>
    } @else if (series().length === 0) {
      <div class="empty">
        <div class="empty-icon">📚</div>
        <h3>{{ searchQuery ? 'No series match "' + searchQuery + '"' : 'No series found' }}</h3>
        @if (searchQuery) { <button class="btn-reset" (click)="searchQuery=''; onSearch()">Reset</button> }
      </div>
    } @else {
      <div class="s-grid">
        @for (s of series(); track s.id; let i = $index) {
          <article class="s-card" [style.--idx]="i">
            <div class="sc-top">
              <div class="sc-icon">📚</div>
              <div class="sc-count">{{ s._count?.games ?? s.games?.length ?? 0 }}</div>
            </div>
            <div class="sc-body">
              <h3 class="sc-title">{{ s.name }}</h3>
              @if (s.description) {
                <p class="sc-desc">{{ s.description }}</p>
              }
            </div>
            @if (s.games?.length) {
              <div class="sc-games">
                @for (game of (s.games ?? []).slice(0, 6); track game.id) {
                  <a class="sc-game" [routerLink]="['/games', game.slug || '']" (click)="$event.stopPropagation()">
                    {{ game.title }}
                    <span class="sc-gyr">{{ game.firstReleaseYear }}</span>
                  </a>
                }
                @if ((s.games ?? []).length > 6) {
                  <span class="sc-more">+{{ (s.games ?? []).length - 6 }} more</span>
                }
              </div>
            }
          </article>
        }
      </div>
    }

    @if (totalPages() > 1) {
      <div class="pager">
        <button class="pg-btn" [disabled]="page() === 1" (click)="go(page() - 1)">Prev</button>
        @for (p of range(); track p) {
          <button class="pg-dot" [class.on]="p === page()" (click)="go(p)">{{ p }}</button>
        }
        <button class="pg-btn" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">Next</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .s-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle);
    }
    .s-header h2 {
      font-size: 28px; font-weight: 800; letter-spacing: -.04em;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-info) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .s-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .sh-val { font-size: 22px; font-weight: 800; color: var(--accent-info); }
    .sh-lbl { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); font-weight: 600; text-align: center; }

    .s-bar {
      background: var(--bg-secondary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); padding: 16px 20px; margin-bottom: 24px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .s-search {
      display: flex; align-items: center; gap: 10px;
      background: var(--bg-primary); border: 1px solid var(--border-default);
      border-radius: 10px; padding: 10px 14px; transition: all .15s;
    }
    .s-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    .ss-icon { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
    .ss-input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit; }
    .ss-input::placeholder { color: var(--text-muted); }
    .ss-clear { background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); display: flex; }
    .ss-clear:hover { color: var(--text-primary); }
    .ss-clear svg { width: 14px; height: 14px; }

    .s-sort { display: flex; gap: 6px; }
    .s-chip {
      padding: 5px 14px; border-radius: 20px; border: 1px solid var(--border-default);
      background: var(--bg-tertiary); color: var(--text-secondary);
      font-size: 12px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .s-chip:hover { border-color: var(--accent); color: var(--text-primary); }
    .s-chip.on { background: var(--accent-glow); color: var(--accent); border-color: var(--accent); }

    .s-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px;
    }
    .s-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); padding: 20px;
      transition: transform .25s, box-shadow .25s, border-color .25s;
      animation: in 350ms ease-out both;
      animation-delay: calc(var(--idx, 0) * 30ms);
      display: flex; flex-direction: column; gap: 12px;
    }
    .s-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(0,0,0,.4), 0 0 20px var(--accent-glow);
      border-color: var(--border-accent);
    }
    @keyframes in {
      from { opacity: 0; transform: translateY(10px) scale(.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .sc-top { display: flex; align-items: center; justify-content: space-between; }
    .sc-icon {
      width: 44px; height: 44px; border-radius: 12px; background: rgba(79,195,247,.12);
      display: flex; align-items: center; justify-content: center; font-size: 22px;
    }
    .sc-count {
      padding: 4px 12px; border-radius: 20px; background: var(--accent-glow);
      color: var(--accent); font-size: 13px; font-weight: 800; border: 1px solid var(--border-accent);
    }

    .sc-body { flex: 1; }
    .sc-title { font-size: 17px; font-weight: 700; color: var(--text-primary); letter-spacing: -.02em; margin-bottom: 4px; }
    .sc-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .sc-games {
      border-top: 1px solid var(--border-subtle); padding-top: 10px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .sc-game {
      display: flex; justify-content: space-between; align-items: center;
      padding: 5px 10px; border-radius: 6px; background: var(--bg-tertiary);
      text-decoration: none; color: var(--text-secondary); font-size: 13px;
      transition: all .15s;
    }
    .sc-game:hover { background: var(--bg-elevated); color: var(--text-primary); }
    .sc-gyr { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }
    .sc-more { font-size: 11px; color: var(--text-muted); text-align: center; padding: 2px 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
    .skel-card {
      border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card);
      padding: 20px; display: flex; flex-direction: column; gap: 12px;
    }
    .skel-cover {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%);
      background-size: 200% 100%; animation: shim 1.5s infinite;
    }
    .skel-info { display: flex; flex-direction: column; gap: 8px; }
    .skel-l { border-radius: 6px; height: 12px; background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%); background-size: 200% 100%; animation: shim 1.5s infinite; }
    .skel-l--t { width: 60%; height: 16px; }
    .skel-l--m { width: 35%; }
    @keyframes shim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
    .empty .empty-icon { font-size: 48px; }
    .empty h3 { font-size: 18px; font-weight: 700; }
    .btn-reset {
      margin-top: 4px; padding: 8px 20px; border-radius: 20px;
      border: 1px solid var(--accent); background: var(--accent-glow);
      color: var(--accent); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
    }

    .pager { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 36px; }
    .pg-btn {
      padding: 7px 14px; border-radius: 8px;
      border: 1px solid var(--border-default); background: var(--bg-secondary);
      color: var(--text-secondary); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .pg-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
    .pg-dot {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid transparent;
      background: none; color: var(--text-secondary); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .pg-dot:hover { border-color: var(--border-default); }
    .pg-dot.on { background: var(--accent); color: #fff; }

    @media (max-width: 640px) {
      .s-grid { grid-template-columns: 1fr; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesPageComponent implements OnInit {
  private seriesService = inject(SeriesService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  series = signal<Series[]>([]);
  loading = signal(true);
  total = signal(0);
  totalPages = signal(1);
  page = signal(1);
  limit = 24;
  searchQuery = "";
  sort = signal<"name" | "games">("name");
  order = signal<"asc" | "desc">("asc");

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const load = () => {
      if (this.auth.isLoggedIn()) { this.fetch(); }
      else { setTimeout(load, 500); }
    };
    load();
  }

  fetch(): void {
    this.loading.set(true);
    const params = new URLSearchParams();
    params.set("page", String(this.page()));
    params.set("limit", String(this.limit));
    if (this.searchQuery) params.set("search", this.searchQuery);
    params.set("sort", this.sort());
    params.set("order", this.order());

    this.http.get<any>(`/api/series?${params.toString()}`).subscribe({
      next: (res: any) => {
        const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
        const shaped = items.map((s: any) => ({
          ...s,
          _count: s._count ?? (s.gameCount ? { games: s.gameCount } : undefined),
        }));
        this.series.set(shaped as Series[]);
        this.total.set(res?.meta?.total ?? items.length);
        this.totalPages.set(res?.meta?.totalPages ?? 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.fetch(); }, 300);
  }

  toggleSort(field: "name" | "games"): void {
    if (this.sort() === field) {
      this.order.set(this.order() === "asc" ? "desc" : "asc");
    } else {
      this.sort.set(field);
      this.order.set("asc");
    }
    this.fetch();
  }

  go(p: number): void { this.page.set(p); this.fetch(); window.scrollTo({ top: 0, behavior: "smooth" }); }

  range(): number[] {
    const c = this.page(); const t = this.totalPages();
    const r: number[] = [];
    for (let i = Math.max(1, c - 2); i <= Math.min(t, c + 2); i++) r.push(i);
    return r;
  }
}
