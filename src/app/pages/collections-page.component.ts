import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from "@angular/core";
import { RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { CollectionsService } from "../services/collections.service";
import { AuthService } from "../services/auth.service";
import { Collection } from "../types/game.types";

@Component({
  selector: "app-collections-page",
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="c-header">
      <div class="ch-left">
        <h2>Collections</h2>
        <p>{{ total() }} compilations &amp; bundles</p>
      </div>
      <div class="ch-stat"><span class="chs-val">{{ total() }}</span><span class="chs-lbl">Collections</span></div>
    </div>

    <div class="c-bar">
      <div class="c-search">
        <svg class="cs-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input class="cs-input" type="text" placeholder="Filter collections..." [(ngModel)]="filter" (input)="onFilter()" />
        @if (filter) {
          <button class="cs-clear" (click)="filter=''; onFilter()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="skel-grid">
        @for (i of [0,1,2,3,4,5]; track i) {
          <div class="skel-card"><div class="skel-icon"></div><div class="skel-l skel-l--t"></div><div class="skel-l skel-l--m"></div></div>
        }
      </div>
    } @else if (filtered().length === 0) {
      <div class="empty"><div class="empty-icon">📦</div>
        <h3>{{ filter ? 'No collections match "' + filter + '"' : 'No collections found' }}</h3>
      </div>
    } @else {
      <div class="c-grid">
        @for (coll of filtered(); track coll.id; let i = $index) {
          <article class="c-card" [style.--idx]="i">
            <div class="cc-top">
              <div class="cc-icon">📦</div>
              @if (coll.releaseYear) { <span class="cc-year">{{ coll.releaseYear }}</span> }
            </div>
            <h3 class="cc-title">{{ coll.title }}</h3>
            @if (coll.mediaFormat?.name) { <span class="cc-fmt">{{ coll.mediaFormat?.name }}</span> }
            <div class="cc-platforms">
              @for (p of platforms(coll); track p) { <span class="cc-chip">{{ p }}</span> }
            </div>
            @if (coll.releases?.length) {
              <div class="cc-items">
                @for (rel of (coll.releases ?? []).slice(0, 5); track rel.id) {
                  <a class="cci-row" [routerLink]="['/games', rel.releaseGroup?.masterGame?.slug ?? '']" (click)="$event.stopPropagation()">
                    <span class="cci-name">{{ rel.releaseGroup?.masterGame?.title ?? rel.title ?? "—" }}</span>
                    <span class="cci-edition">{{ rel.releaseGroup?.editionType?.name ?? "" }}</span>
                  </a>
                }
                @if ((coll.releases ?? []).length > 5) {
                  <span class="cci-more">+{{ (coll.releases ?? []).length - 5 }} more</span>
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
        <span class="pg-info">Page {{ page() }} of {{ totalPages() }}</span>
        <button class="pg-btn" [disabled]="page() >= totalPages()" (click)="go(page() + 1)">Next</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .c-header {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle);
    }
    .c-header h2 {
      font-size: 28px; font-weight: 800; letter-spacing: -.04em;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-warn) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .c-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .chs-val { font-size: 22px; font-weight: 800; color: var(--accent-warn); }
    .chs-lbl { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--text-muted); font-weight: 600; text-align: center; }

    .c-bar {
      background: var(--bg-secondary); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-xl); padding: 12px 18px; margin-bottom: 24px;
    }
    .c-search {
      display: flex; align-items: center; gap: 10px;
      background: var(--bg-primary); border: 1px solid var(--border-default);
      border-radius: 10px; padding: 9px 14px; transition: all .15s;
    }
    .c-search:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); }
    .cs-icon { width: 16px; height: 16px; color: var(--text-muted); flex-shrink: 0; }
    .cs-input { flex: 1; background: none; border: none; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit; }
    .cs-input::placeholder { color: var(--text-muted); }
    .cs-clear { background: none; border: none; cursor: pointer; padding: 2px; color: var(--text-muted); display: flex; }
    .cs-clear:hover { color: var(--text-primary); }
    .cs-clear svg { width: 14px; height: 14px; }

    .c-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
    .c-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg); padding: 20px;
      transition: transform .25s, box-shadow .25s, border-color .25s;
      animation: in 350ms ease-out both;
      animation-delay: calc(var(--idx, 0) * 30ms);
      display: flex; flex-direction: column; gap: 12px;
    }
    .c-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(0,0,0,.4), 0 0 20px var(--accent-glow);
      border-color: var(--border-accent);
    }
    @keyframes in { from { opacity: 0; transform: translateY(10px) scale(.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

    .cc-top { display: flex; align-items: center; justify-content: space-between; }
    .cc-icon { width: 42px; height: 42px; border-radius: 10px; background: rgba(247,110,110,.1); display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .cc-year { font-size: 11px; color: var(--text-muted); font-weight: 600; }
    .cc-title { font-size: 16px; font-weight: 700; color: var(--text-primary); letter-spacing: -.01em; }
    .cc-fmt {
      display: inline-flex; align-self: flex-start; padding: 2px 10px; border-radius: 10px;
      background: var(--accent-glow); color: var(--accent); font-size: 11px; font-weight: 600; border: 1px solid var(--border-accent);
    }
    .cc-platforms { display: flex; gap: 4px; flex-wrap: wrap; }
    .cc-chip {
      padding: 2px 8px; border-radius: 10px; background: rgba(79,195,247,.1);
      color: var(--accent-info); font-size: 10px; font-weight: 600; border: 1px solid rgba(79,195,247,.2);
    }
    .cc-items { border-top: 1px solid var(--border-subtle); padding-top: 10px; display: flex; flex-direction: column; gap: 3px; }
    .cci-row {
      display: flex; justify-content: space-between; align-items: center; padding: 4px 8px;
      border-radius: 6px; background: var(--bg-tertiary); text-decoration: none; transition: all .15s;
    }
    .cci-row:hover { background: var(--bg-elevated); }
    .cci-name { font-size: 12px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cci-edition { font-size: 11px; color: var(--text-muted); flex-shrink: 0; margin-left: 8px; }
    .cci-more { font-size: 11px; color: var(--text-muted); text-align: center; padding: 2px 0; }

    .skel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
    .skel-card { border-radius: var(--radius-lg); background: var(--bg-card); padding: 20px; display: flex; flex-direction: column; gap: 12px; }
    .skel-icon { width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%); background-size: 200% 100%; animation: shim 1.5s infinite; }
    .skel-l { border-radius: 6px; height: 12px; background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%); background-size: 200% 100%; animation: shim 1.5s infinite; }
    .skel-l--t { width: 60%; height: 16px; }
    .skel-l--m { width: 35%; }
    @keyframes shim { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    .empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 20px; text-align: center; }
    .empty .empty-icon { font-size: 48px; }
    .empty h3 { font-size: 18px; font-weight: 700; }

    .pager { display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 36px; }
    .pg-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border-default); background: var(--bg-secondary); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .15s; font-family: inherit; }
    .pg-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
    .pg-btn:disabled { opacity: .35; cursor: not-allowed; }
    .pg-info { font-size: 13px; color: var(--text-muted); }

    @media (max-width: 640px) { .c-grid { grid-template-columns: 1fr; } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsPageComponent implements OnInit {
  private collService = inject(CollectionsService);
  private auth = inject(AuthService);
  collections = signal<Collection[]>([]);
  filtered = signal<Collection[]>([]);
  loading = signal(true);
  page = signal(1);
  totalPages = signal(1);
  total = signal(0);
  filter = "";
  limit = 24;

  ngOnInit(): void {
    const load = () => { if (this.auth.isLoggedIn()) { this.fetch(); } else { setTimeout(load, 500); } };
    load();
  }

  fetch(): void {
    this.loading.set(true);
    this.collService.getCollections(this.page(), this.limit).subscribe({
      next: (data) => {
        this.collections.set(data);
        this.total.set(data.length);
        this.totalPages.set(data.length < this.limit ? 1 : Math.ceil(999 / this.limit));
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFilter(): void { this.applyFilter(); }
  applyFilter(): void {
    const q = this.filter.trim().toLowerCase();
    if (!q) { this.filtered.set(this.collections()); return; }
    this.filtered.set(this.collections().filter((c) => c.title.toLowerCase().includes(q)));
  }

  platforms(coll: Collection): string[] {
    const set = new Set<string>();
    coll.releases?.forEach((r) => r.playableOn?.forEach((p) => set.add(p)));
    return [...set].sort();
  }

  go(p: number): void { this.page.set(p); this.fetch(); window.scrollTo({ top: 0, behavior: "smooth" }); }
}
