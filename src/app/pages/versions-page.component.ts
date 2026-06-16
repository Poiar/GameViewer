import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { ReleasesService } from "../services/releases.service";
import { AuthService } from "../services/auth.service";
import { Release } from "../types/game.types";

@Component({
  selector: "app-versions-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="v-header">
      <div class="vh-left">
        <h2>Versions</h2>
        <p>{{ total() }} individual releases across all platforms</p>
      </div>
      <div class="vh-stat">
        <span class="vhs-val">{{ total() }}</span>
        <span class="vhs-lbl">Releases</span>
      </div>
    </div>

    <div class="v-bar">
      <div class="v-search">
        <svg class="vs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input class="vs-input" type="text" placeholder="Search by game title, platform, provider..." [(ngModel)]="searchQuery" (input)="onSearch()" />
        @if (searchQuery) {
          <button class="vs-clear" (click)="searchQuery=''; onSearch()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="skel-list">
        @for (i of [0,1,2,3,4,5,6,7]; track i) {
          <div class="skel-row"><div class="skel-l skel-l--g"></div><div class="skel-l skel-l--p"></div><div class="skel-l skel-l--f"></div></div>
        }
      </div>
    } @else if (releases().length === 0) {
      <div class="empty">
        <div class="empty-icon">💿</div>
        <h3>{{ searchQuery ? 'No releases match "' + searchQuery + '"' : 'No releases found' }}</h3>
        @if (searchQuery) { <button class="btn-r" (click)="searchQuery=''; fetch()">Reset</button> }
      </div>
    } @else {
      <div class="v-list">
        @for (rel of releases(); track rel.id; let i = $index) {
          <div class="v-row" [class.owned]="!!rel.userOwns" [style.--idx]="i">
            <div class="vr-game">
              @if (rel.masterGame?.title) {
                <a
                  class="vr-title"
                  [routerLink]="['/games', rel.masterGame?.slug ?? '']"
                >{{ rel.masterGame?.title ?? rel.title }}</a>
              } @else {
                <span class="vr-title vr-title--plain">{{ rel.title ?? "Unknown" }}</span>
              }
              <div class="vr-edition">
                @if (rel.editionType?.name) {
                  <span class="vrb vrb-ed">{{ rel.editionType?.name }}</span>
                }
                @if (rel.releaseGroup?.editionName) {
                  <span class="vrb vrb-name">{{ rel.releaseGroup?.editionName }}</span>
                }
              </div>
            </div>
            <div class="vr-platforms">
              @for (p of rel.playableOn; track p) {
                <span class="vrb vrb-plat">{{ p }}</span>
              } @empty {
                <span class="vrb vrb-none">—</span>
              }
            </div>
            <div class="vr-meta">
              @if (rel.provider?.name) {
                <span class="vrm-provider">{{ rel.provider?.name ?? "" }}</span>
              }
              @if (rel.mediaFormat?.name) {
                <span class="vrb vrb-fmt">{{ rel.mediaFormat?.name ?? "" }}</span>
              }
              @if (rel.region) {
                <span class="vrb vrb-region">{{ rel.region }}</span>
              }
              @if (rel.userOwns) {
                <span class="vrb vrb-owned">✓</span>
              }
            </div>
          </div>
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
    .v-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle);
    }
    .v-header h2 {
      font-size: 28px; font-weight: 800; letter-spacing: -.04em;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-secondary) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .v-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .vhs-val { font-size: 22px; font-weight: 800; color: var(--accent-secondary); }
    .vhs-lbl { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); font-weight: 600; text-align: center; }

    .v-bar {
      background: var(--bg-secondary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); padding: 14px 18px; margin-bottom: 20px;
    }
    .v-search {
      display: flex; align-items: center; gap: 10px;
      background: var(--bg-primary); border: 1px solid var(--border-default);
      border-radius: 10px; padding: 10px 14px; transition: all .15s;
    }
    .v-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    .vs-icon { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
    .vs-input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit; }
    .vs-input::placeholder { color: var(--text-muted); }
    .vs-clear { background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); display: flex; }
    .vs-clear:hover { color: var(--text-primary); }
    .vs-clear svg { width: 14px; height: 14px; }

    .v-list {
      display: flex; flex-direction: column; gap: 1px;
      background: var(--bg-secondary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); overflow: hidden;
    }
    .v-row {
      display: flex; align-items: center; gap: 20px; padding: 14px 20px;
      transition: background .15s;
      animation: rowIn 300ms ease-out both;
      animation-delay: calc(var(--idx, 0) * 12ms);
    }
    .v-row:hover { background: var(--bg-elevated); }
    .v-row + .v-row { border-top: 1px solid var(--border-subtle); }
    .v-row.owned { background: rgba(6,214,160,.03); }
    .v-row.owned:hover { background: rgba(6,214,160,.06); }
    @keyframes rowIn {
      from { opacity: 0; transform: translateX(-6px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .vr-game { flex: 2; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .vr-title {
      font-size: 14px; font-weight: 600; color: var(--text-primary);
      text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .vr-title:hover { color: var(--accent); text-decoration: underline; }
    .vr-title--plain { cursor: default; }
    .vr-title--plain:hover { color: var(--text-primary); text-decoration: none; }

    .vr-edition { display: flex; gap: 6px; flex-wrap: wrap; }

    .vrb {
      display: inline-flex; align-items: center; padding: 1px 8px;
      border-radius: 10px; font-size: 10px; font-weight: 600;
      white-space: nowrap;
    }
    .vrb-ed { background: var(--accent-glow); color: var(--accent); border: 1px solid var(--border-accent); }
    .vrb-name { background: rgba(6,214,160,.1); color: var(--accent-secondary); border: 1px solid rgba(6,214,160,.25); }
    .vrb-plat {
      background: rgba(79,195,247,.1); color: var(--accent-info);
      border: 1px solid rgba(79,195,247,.25);
    }
    .vrb-fmt { background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-subtle); }
    .vrb-region { background: var(--bg-tertiary); color: var(--text-muted); border: 1px solid var(--border-subtle); font-weight: 500; }
    .vrb-owned {
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--accent-secondary); color: #000;
      font-size: 11px; font-weight: 800; display: inline-flex;
      align-items: center; justify-content: center;
      border: none; flex-shrink: 0;
    }
    .vrb-none { background: var(--bg-tertiary); color: var(--text-muted); border: 1px solid var(--border-subtle); font-style: italic; }

    .vr-platforms { flex: 1.5; display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
    .vr-meta { flex: 1; display: flex; align-items: center; gap: 8px; justify-content: flex-end; min-width: 0; }
    .vrm-provider { font-size: 12px; color: var(--text-muted); font-weight: 500; }

    .skel-list { display: flex; flex-direction: column; gap: 1px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; }
    .skel-row { display: flex; gap: 20px; padding: 16px 20px; }
    .skel-row + .skel-row { border-top: 1px solid var(--border-subtle); }
    .skel-l { border-radius: 6px; height: 12px; background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%); background-size: 200% 100%; animation: shim 1.5s infinite; }
    .skel-l--g { flex: 2; height: 16px; }
    .skel-l--p { flex: 1.5; }
    .skel-l--f { flex: 1; }
    @keyframes shim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
    .empty .empty-icon { font-size: 48px; }
    .empty h3 { font-size: 18px; font-weight: 700; }
    .btn-r {
      margin-top: 4px; padding: 8px 20px; border-radius: 20px;
      border: 1px solid var(--accent); background: var(--accent-glow);
      color: var(--accent); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
    }

    .pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 28px; }
    .pg-btn {
      padding: 7px 14px; border-radius: 8px;
      border: 1px solid var(--border-default); background: var(--bg-secondary);
      color: var(--text-secondary); font-size: 13px; font-weight: 600;
      cursor: pointer; transition: all .15s; font-family: inherit;
    }
    .pg-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
    .pg-info { font-size: 13px; color: var(--text-muted); }

    @media (max-width: 768px) {
      .v-row { flex-wrap: wrap; gap: 8px; padding: 12px; }
      .vr-meta { flex-basis: 100%; justify-content: flex-start; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsPageComponent implements OnInit {
  private releasesService = inject(ReleasesService);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  releases = signal<Release[]>([]);
  loading = signal(true);
  total = signal(0);
  totalPages = signal(1);
  page = signal(1);
  limit = 50;
  searchQuery = "";

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
    const params: any = { page: this.page(), limit: this.limit };
    if (this.searchQuery.trim()) params.search = this.searchQuery.trim();
    this.releasesService.getReleases(params).subscribe({
      next: (data) => {
        this.releases.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.fetch();
    }, 300);
  }

  go(p: number): void { this.page.set(p); this.fetch(); window.scrollTo({ top: 0, behavior: "smooth" }); }
}
