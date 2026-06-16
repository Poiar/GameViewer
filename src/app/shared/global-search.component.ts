import { Component, inject, signal, HostListener } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";

interface SearchResult {
  type: "game" | "series" | "dlc";
  id: number;
  title: string;
  subtitle?: string;
  slug?: string;
  url: string;
}

@Component({
  selector: "app-global-search",
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <button class="gs-trigger" (click)="open()" title="Search (⌘K)">
      <svg class="gs-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <span class="gs-trigger-text">Search...</span>
      <kbd class="gs-trigger-kbd">⌘K</kbd>
    </button>

    @if (openSignal()) {
      <div class="gs-overlay" (click)="close()">
        <div class="gs-modal" (click)="$event.stopPropagation()">
          <div class="gs-input-wrap">
            <svg class="gs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              #searchInput
              class="gs-input"
              type="text"
              placeholder="Search games, series, DLCs..."
              [(ngModel)]="query"
              (input)="doSearch()"
              (keydown.escape)="close()"
              (keydown.arrowdown)="moveDown($event)"
              (keydown.arrowup)="moveUp($event)"
              (keydown.enter)="selectActive()"
            />
            @if (query) {
              <button class="gs-clear" (click)="query=''; results.set([])">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            }
          </div>

          <div class="gs-results">
            @if (searching()) {
              <div class="gs-status">Searching...</div>
            } @else if (results().length === 0 && query) {
              <div class="gs-status">No results for "{{ query }}"</div>
            } @else if (results().length > 0) {
              @for (r of results(); track r.url; let i = $index) {
                <a
                  class="gs-result"
                  [class.gs-result--active]="i === activeIdx()"
                  [routerLink]="r.url"
                  (click)="close()"
                  (mouseenter)="activeIdx.set(i)"
                >
                  <span class="gsr-type gsr-type--{{ r.type }}">{{ r.type }}</span>
                  <span class="gsr-title">{{ r.title }}</span>
                  @if (r.subtitle) { <span class="gsr-sub">{{ r.subtitle }}</span> }
                </a>
              }
            } @else {
              <div class="gs-status">Type to search across your catalog...</div>
            }
          </div>

          <div class="gs-footer">
            <span><kbd>↑↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open</span>
            <span><kbd>Esc</kbd> Close</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: flex; align-items: center; }

    .gs-trigger {
      display: flex; align-items: center; gap: 8px;
      padding: 7px 14px; border-radius: 10px;
      border: 1px solid var(--border-default); background: var(--bg-primary);
      color: var(--text-muted); font-size: 13px; font-family: inherit; cursor: pointer;
      transition: all .15s; width: 220px;
    }
    .gs-trigger:hover { border-color: var(--accent); color: var(--text-secondary); }
    .gs-trigger-icon { width: 15px; height: 15px; flex-shrink: 0; }
    .gs-trigger-text { flex: 1; text-align: left; }
    .gs-trigger-kbd {
      padding: 1px 6px; border-radius: 4px; background: var(--bg-elevated);
      font-size: 10px; font-family: inherit; font-weight: 600; color: var(--text-muted);
      border: 1px solid var(--border-subtle);
    }

    .gs-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
      display: flex; align-items: flex-start; justify-content: center; padding-top: 120px;
      z-index: 500; animation: fadeIn 150ms;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .gs-modal {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); width: 560px; max-width: 95vw;
      box-shadow: 0 24px 60px rgba(0,0,0,.6); overflow: hidden;
      animation: modalIn 200ms cubic-bezier(.4,0,.2,1);
    }
    @keyframes modalIn { from { opacity: 0; transform: translateY(-16px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .gs-input-wrap {
      display: flex; align-items: center; gap: 12px; padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .gs-icon { width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0; }
    .gs-input {
      flex: 1; background: none; border: none; color: var(--text-primary);
      font-size: 16px; font-weight: 500; outline: none; font-family: inherit;
    }
    .gs-input::placeholder { color: var(--text-muted); }
    .gs-clear { background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); display: flex; }
    .gs-clear:hover { color: var(--text-primary); }
    .gs-clear svg { width: 14px; height: 14px; }

    .gs-results { max-height: 400px; overflow-y: auto; padding: 8px; }
    .gs-status { padding: 24px; text-align: center; color: var(--text-muted); font-size: 14px; }
    .gs-result {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      border-radius: 8px; text-decoration: none; transition: background .1s;
    }
    .gs-result:hover, .gs-result--active { background: var(--accent-glow); }
    .gsr-type {
      padding: 1px 7px; border-radius: 8px; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em; flex-shrink: 0; min-width: 48px; text-align: center;
    }
    .gsr-type--game { background: rgba(6,214,160,.15); color: var(--accent-secondary); }
    .gsr-type--series { background: rgba(79,195,247,.15); color: var(--accent-info); }
    .gsr-type--dlc { background: var(--accent-glow); color: var(--accent); }
    .gsr-title { font-size: 14px; font-weight: 600; color: var(--text-primary); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .gsr-sub { font-size: 12px; color: var(--text-muted); flex-shrink: 0; }

    .gs-footer {
      display: flex; gap: 16px; padding: 10px 20px; border-top: 1px solid var(--border-subtle);
      font-size: 11px; color: var(--text-muted);
    }
    .gs-footer kbd {
      padding: 1px 5px; border-radius: 3px; background: var(--bg-elevated);
      font-size: 10px; font-family: inherit; font-weight: 600;
    }

    @media (max-width: 640px) {
      .gs-trigger { width: 140px; }
      .gs-trigger-text { display: none; }
      .gs-trigger-kbd { display: none; }
    }
  `],
})
export class GlobalSearchComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  openSignal = signal(false);
  query = "";
  results = signal<SearchResult[]>([]);
  searching = signal(false);
  activeIdx = signal(0);

  private searchTimeout?: ReturnType<typeof setTimeout>;

  @HostListener("document:keydown", ["$event"])
  onKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      this.open();
    }
  }

  open(): void { this.openSignal.set(true); setTimeout(() => (document.querySelector(".gs-input") as HTMLInputElement)?.focus(), 50); }
  close(): void { this.openSignal.set(false); this.query = ""; this.results.set([]); }

  doSearch(): void {
    clearTimeout(this.searchTimeout);
    const q = this.query.trim();
    if (!q) { this.results.set([]); return; }
    this.searching.set(true);
    this.searchTimeout = setTimeout(() => {
      this.http.get<any>(`/api/games?search=${encodeURIComponent(q)}&limit=5`).subscribe({
        next: (res) => {
          const items: SearchResult[] = [];
          const games = res.data ?? res;
          (Array.isArray(games) ? games.slice(0, 5) : []).forEach((g: any) => {
            items.push({ type: "game", id: g.id, title: g.title, subtitle: String(g.firstReleaseYear ?? ""), slug: g.slug, url: g.slug ? `/games/${g.slug}` : `/games` });
          });
          // Also search series
          this.http.get<any>(`/api/series?search=${encodeURIComponent(q)}&limit=3`).subscribe({
            next: (sRes) => {
              const seriesList = sRes.data ?? sRes;
              (Array.isArray(seriesList) ? seriesList.slice(0, 3) : []).forEach((s: any) => {
                items.push({ type: "series", id: s.id, title: s.name, subtitle: `${s.gameCount ?? s._count?.games ?? 0} games`, url: `/series` });
              });
              this.results.set(items);
              this.activeIdx.set(0);
              this.searching.set(false);
            },
            error: () => { this.results.set(items); this.activeIdx.set(0); this.searching.set(false); },
          });
        },
        error: () => this.searching.set(false),
      });
    }, 200);
  }

  moveDown(e: Event): void { e.preventDefault(); this.activeIdx.update((i) => Math.min(i + 1, this.results().length - 1)); }
  moveUp(e: Event): void { e.preventDefault(); this.activeIdx.update((i) => Math.max(i - 1, 0)); }

  selectActive(): void {
    const r = this.results()[this.activeIdx()];
    if (r) { this.router.navigateByUrl(r.url); this.close(); }
  }
}
