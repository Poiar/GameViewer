import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { DlcService, DlcSummary } from "../services/dlc.service";
import { AuthService } from "../services/auth.service";

@Component({
  selector: "app-dlc-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="dlc-header">
      <h2>DLCs &amp; Expansions</h2>
      <p>{{ total() }} add-ons across all games</p>
    </div>

    <div class="dlc-bar">
      <div class="search-wrap">
        <svg class="s-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input class="s-input" type="text" placeholder="Filter DLCs..." [(ngModel)]="filter" (input)="onFilter()" />
        @if (filter) {
          <button class="s-clear" (click)="filter = ''; onFilter()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="s-x"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="loader"><div class="spinner"></div></div>
    } @else if (filtered().length === 0) {
      <div class="empty">
        <div class="empty-icon">💿</div>
        <h3>{{ filter ? 'No DLCs match "' + filter + '"' : 'No DLCs found' }}</h3>
      </div>
    } @else {
      <div class="dlc-list">
        @for (dlc of filtered(); track dlc.id; let i = $index) {
          <a class="dlc-row" [routerLink]="['/games', dlc.gameSlug]" [style.--idx]="i">
            <div class="dlc-left">
              <span class="dlc-type-badge" [class]="'type-' + dlc.dlcType.toLowerCase()">{{ dlc.dlcType }}</span>
              <h3 class="dlc-title">{{ dlc.title }}</h3>
            </div>
            <div class="dlc-center">
              <span class="dlc-game">{{ dlc.gameTitle }}</span>
            </div>
            <div class="dlc-right">
              @if (dlc.firstReleaseYear) {
                <span class="dlc-year">{{ dlc.firstReleaseYear }}</span>
              }
              @if (dlc.releaseCount > 0) {
                <span class="dlc-count">{{ dlc.releaseCount }} release{{ dlc.releaseCount > 1 ? 's' : '' }}</span>
              }
            </div>
          </a>
        }
      </div>
    }

    @if (totalPages() > 1) {
      <div class="pager">
        <button class="pg-btn" [disabled]="page() === 1" (click)="go(page() - 1)">Prev</button>
        <span class="pg-info">Page {{ page() }} of {{ totalPages() }}</span>
        <button class="pg-btn" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">Next</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .dlc-header {
      margin-bottom: 20px; padding-bottom: 16px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .dlc-header h2 {
      font-size: 28px; font-weight: 800; letter-spacing: -0.04em;
      background: linear-gradient(135deg, var(--accent-secondary) 0%, var(--accent-info) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .dlc-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }

    .dlc-bar {
      background: var(--bg-secondary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); padding: 12px 18px; margin-bottom: 20px;
    }
    .search-wrap {
      display: flex; align-items: center; gap: 10px;
      background: var(--bg-primary); border: 1px solid var(--border-default);
      border-radius: 10px; padding: 9px 14px; transition: all .15s;
    }
    .search-wrap:focus-within {
      border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .s-icon { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
    .s-input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit; }
    .s-input::placeholder { color: var(--text-muted); }
    .s-clear { background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); }
    .s-clear:hover { color: var(--text-primary); }
    .s-x { width: 14px; height: 14px; }

    .dlc-list {
      display: flex; flex-direction: column; gap: 2px;
      background: var(--bg-secondary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); overflow: hidden;
    }
    .dlc-row {
      display: flex; align-items: center; gap: 16px; padding: 14px 18px;
      text-decoration: none; transition: background .15s;
      animation: rowIn 300ms ease-out both;
      animation-delay: calc(var(--idx, 0) * 15ms);
    }
    .dlc-row:hover { background: var(--bg-elevated); }
    .dlc-row + .dlc-row { border-top: 1px solid var(--border-subtle); }
    @keyframes rowIn {
      from { opacity: 0; transform: translateX(-8px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .dlc-left { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
    .dlc-type-badge {
      padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em; flex-shrink: 0;
      background: var(--accent-glow); color: var(--accent); border: 1px solid var(--border-accent);
    }
    .type-dlc { background: rgba(6,214,160,.12); color: var(--accent-secondary); border-color: rgba(6,214,160,.3); }
    .type-expansion { background: rgba(79,195,247,.12); color: var(--accent-info); border-color: rgba(79,195,247,.3); }
    .type-cosmetic { background: rgba(251,191,36,.12); color: #fbbf24; border-color: rgba(251,191,36,.3); }

    .dlc-title {
      font-size: 14px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .dlc-center { flex: 1; min-width: 0; display: flex; align-items: center; }
    .dlc-game {
      font-size: 12px; color: var(--text-muted); white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .dlc-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .dlc-year { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .dlc-count {
      padding: 1px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;
      background: var(--bg-tertiary); color: var(--text-secondary);
      border: 1px solid var(--border-subtle);
    }

    .loader { padding: 60px 0; display: flex; justify-content: center; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
    .empty .empty-icon { font-size: 48px; }
    .empty h3 { font-size: 16px; font-weight: 600; color: var(--text-secondary); }

    .pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 24px; }
    .pg-btn {
      padding: 7px 14px; border-radius: 8px;
      border: 1px solid var(--border-default); background: var(--bg-secondary);
      color: var(--text-secondary); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .pg-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
    .pg-info { font-size: 13px; color: var(--text-muted); }

    @media (max-width: 640px) {
      .dlc-row { flex-wrap: wrap; gap: 6px; padding: 12px; }
      .dlc-center { display: none; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlcPageComponent implements OnInit {
  private dlcService = inject(DlcService);
  private auth = inject(AuthService);

  dlcs = signal<DlcSummary[]>([]);
  filtered = signal<DlcSummary[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  filter = "";
  readonly limit = 100;

  private filterTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    const load = () => {
      if (this.auth.isLoggedIn()) { this.fetch(); }
      else { setTimeout(load, 500); }
    };
    load();
  }

  fetch(): void {
    this.loading.set(true);
    this.dlcService.getDlcs({ page: this.page(), limit: this.limit }).subscribe({
      next: (res) => {
        this.dlcs.set(res.data);
        this.total.set(res.meta?.total ?? 0);
        this.totalPages.set(res.meta?.totalPages ?? 1);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilter(): void {
    clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => this.applyFilter(), 200);
  }

  applyFilter(): void {
    const q = this.filter.trim().toLowerCase();
    if (!q) {
      this.filtered.set(this.dlcs());
      return;
    }
    this.filtered.set(
      this.dlcs().filter(
        (d) => d.title.toLowerCase().includes(q) || d.gameTitle.toLowerCase().includes(q),
      ),
    );
  }

  go(p: number): void { this.page.set(p); this.fetch(); window.scrollTo({ top: 0, behavior: "smooth" }); }
}
