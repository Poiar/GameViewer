import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";

interface CollDetail { id: number; title: string; releaseYear: number | null; mediaFormat?: { id: number; name: string } | null; releases?: Array<{ id: number; title: string | null; playableOn: string[]; region: string | null; provider?: { name: string } | null; mediaFormat?: { name: string } | null; releaseGroup?: { editionType?: { name: string } | null; masterGame?: { title: string; slug: string; coverImageUrl?: string | null } | null } | null; userOwns?: boolean }>; }

@Component({
  selector: "app-collection-detail-page", standalone: true, imports: [RouterLink],
  template: `
    <a routerLink="/collections" class="cd-back">← Back to Collections</a>
    @if (loading()) { <div class="cd-load"><div class="spinner"></div></div> }
    @else if (error()) { <div class="cd-err"><p>{{ error() }}</p></div> }
    @else if (coll(); as c) {
      <div class="cd-hero"><h1>{{ c.title }}</h1>
        <div class="cd-meta">
          @if (c.releaseYear) { <span class="cd-year">{{ c.releaseYear }}</span> }
          @if (c.mediaFormat?.name) { <span class="cd-fmt">{{ c.mediaFormat?.name }}</span> }
          <span class="cd-count">{{ c.releases?.length ?? 0 }} releases</span>
        </div>
      </div>
      @if (c.releases?.length) {
        <div class="cd-list">
          @for (rel of c.releases; track rel.id; let i = $index) {
            <a class="cd-row" [class.owned]="!!rel.userOwns" [routerLink]="['/games', rel.releaseGroup?.masterGame?.slug ?? '']" [style.--idx]="i">
              <div class="cdr-cover">
                @if (rel.releaseGroup?.masterGame?.coverImageUrl) {
                  <img class="cdr-cover-img" [src]="rel.releaseGroup?.masterGame?.coverImageUrl" alt="" loading="lazy" />
                }
              </div>
              <div class="cdr-game">
                <span class="cdr-title">{{ rel.releaseGroup?.masterGame?.title ?? rel.title ?? "—" }}</span>
                @if (rel.releaseGroup?.editionType?.name) { <span class="cdr-ed">{{ rel.releaseGroup?.editionType?.name }}</span> }
              </div>
              <div class="cdr-platforms">@for (p of (rel.playableOn ?? []); track p) { <span class="cdr-p">{{ p }}</span> }</div>
              <div class="cdr-meta">
                @if (rel.region) { <span class="cdr-region">{{ rel.region }}</span> }
                @if (rel.provider?.name) { <span class="cdr-prov">{{ rel.provider?.name }}</span> }
                @if (rel.mediaFormat?.name) { <span class="cdr-mf">{{ rel.mediaFormat?.name }}</span> }
                @if (rel.userOwns) { <span class="cdr-own">✓ Owned</span> }
              </div>
            </a>
          }
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .cd-back { display: inline-block; color: var(--accent); text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .cd-back:hover { text-decoration: underline; }
    .cd-hero { margin-bottom: 28px; }
    .cd-hero h1 { font-size: 30px; font-weight: 800; letter-spacing: -.03em; margin-bottom: 8px; }
    .cd-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .cd-year, .cd-fmt { padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--accent-glow); color: var(--accent); }
    .cd-count { padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: rgba(6,214,160,.1); color: var(--accent-secondary); }
    .cd-list { display: flex; flex-direction: column; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; }
    .cd-row { display: flex; align-items: center; gap: 16px; padding: 12px 18px; text-decoration: none; transition: background .15s; animation: in 250ms ease-out both; animation-delay: calc(var(--idx)*15ms); }
    .cd-row:hover { background: var(--bg-elevated); }
    .cd-row+ .cd-row { border-top: 1px solid var(--border-subtle); }
    .cd-row.owned { background: rgba(6,214,160,.04); }
    @keyframes in { from { opacity: 0; } to { opacity: 1; } }
    .cdr-game { flex: 2; min-width: 0; display: flex; gap: 8px; align-items: center; }
    .cdr-cover { width: 36px; height: 50px; flex-shrink: 0; border-radius: 4px; overflow: hidden; background: var(--bg-tertiary); }
    .cdr-cover-img { width: 100%; height: 100%; object-fit: cover; }
    .cdr-title { font-size: 14px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cdr-ed { font-size: 10px; color: var(--accent); background: var(--accent-glow); padding: 1px 6px; border-radius: 8px; flex-shrink: 0; }
    .cdr-platforms { flex: 1.5; display: flex; gap: 4px; flex-wrap: wrap; }
    .cdr-p { padding: 1px 7px; border-radius: 8px; font-size: 10px; font-weight: 600; background: rgba(79,195,247,.1); color: var(--accent-info); }
    .cdr-meta { flex: 1; display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
    .cdr-region, .cdr-prov, .cdr-mf { font-size: 11px; color: var(--text-muted); }
    .cdr-own { color: var(--accent-secondary); font-size: 11px; font-weight: 700; }
    .cd-load { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .cd-err { text-align: center; padding: 80px 0; color: var(--text-muted); }
    @media (max-width: 768px) { .cd-row { flex-wrap: wrap; } }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute); private http = inject(HttpClient);
  coll = signal<CollDetail | null>(null); loading = signal(true); error = signal<string | null>(null);
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) { this.error.set("No collection"); this.loading.set(false); return; }
    this.http.get<any>('/api/collections/'+id).subscribe({
      next: (res) => { this.coll.set(res.data ?? res); this.loading.set(false); },
      error: () => { this.error.set("Not found"); this.loading.set(false); },
    });
  }
}
