import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";

interface SeriesDetail { id: number; name: string; slug: string; description: string | null; games: Array<{ id: number; title: string; slug: string; firstReleaseYear: number; coverImageUrl: string | null; userOwns?: boolean }>; }

@Component({
  selector: "app-series-detail-page", standalone: true, imports: [RouterLink],
  template: `
    <a routerLink="/series" class="sd-back">← Back to Series</a>
    @if (loading()) {
      <div class="sd-loading"><div class="spinner"></div></div>
    } @else if (error()) {
      <div class="sd-error"><p>{{ error() }}</p><a routerLink="/series">← All Series</a></div>
    } @else if (series(); as s) {
      <div class="sd-hero">
        <h1>{{ s.name }}</h1>
        @if (s.description) { <p class="sd-desc">{{ s.description }}</p> }
        <span class="sd-count">{{ s.games.length }} games</span>
      </div>
      @if (s.games.length) {
        <div class="sd-grid">
          @for (game of s.games; track game.id; let i = $index) {
            <a class="sd-card" [class.owned]="!!game.userOwns" [routerLink]="['/games', game.slug]" [style.--idx]="i">
              <div class="sdc-cover">
                @if (game.coverImageUrl) { <img [src]="game.coverImageUrl" [alt]="game.title" loading="lazy" /> }
                @else { <span class="sdc-ph">🎮</span> }
                @if (game.userOwns) { <span class="sdc-owned">✓</span> }
              </div>
              <div class="sdc-body"><h3 class="sdc-title">{{ game.title }}</h3><span class="sdc-year">{{ game.firstReleaseYear }}</span></div>
            </a>
          }
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .sd-back { display: inline-block; color: var(--accent); text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .sd-back:hover { text-decoration: underline; }
    .sd-hero { margin-bottom: 32px; }
    .sd-hero h1 { font-size: 32px; font-weight: 800; letter-spacing: -.04em; margin-bottom: 8px; }
    .sd-desc { color: var(--text-secondary); font-size: 15px; margin-bottom: 12px; max-width: 600px; line-height: 1.6; }
    .sd-count { display: inline-flex; padding: 4px 14px; border-radius: 20px; background: var(--accent-glow); color: var(--accent); font-size: 13px; font-weight: 700; border: 1px solid var(--border-accent); }
    .sd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 18px; }
    .sd-card { border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); border: 1px solid var(--border-subtle); text-decoration: none; display: block; transition: transform .25s, box-shadow .25s; animation: in 350ms ease-out both; animation-delay: calc(var(--idx, 0) * 35ms); }
    .sd-card:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 16px 32px rgba(0,0,0,.5); }
    .sd-card.owned { border-color: rgba(6,214,160,.25); }
    @keyframes in { from { opacity: 0; transform: translateY(12px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .sdc-cover { width: 100%; aspect-ratio: 2/3; overflow: hidden; background: var(--bg-tertiary); position: relative; }
    .sdc-owned {
      position: absolute; top: 6px; right: 6px;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--accent-secondary); color: #000;
      font-size: 11px; font-weight: 800; display: flex;
      align-items: center; justify-content: center;
      z-index: 2;
    }
    .sdc-cover img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
    .sd-card:hover .sdc-cover img { transform: scale(1.06); }
    .sdc-ph { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 40px; opacity: .3; }
    .sdc-body { padding: 10px 12px; }
    .sdc-title { font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sdc-year { font-size: 12px; color: var(--text-muted); }
    .sd-loading { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .sd-error { text-align: center; padding: 80px 0; color: var(--text-muted); }
    @media (max-width: 640px) { .sd-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); } }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute); private http = inject(HttpClient);
  series = signal<SeriesDetail | null>(null); loading = signal(true); error = signal<string | null>(null);
  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get("slug");
    if (!slug) { this.error.set("No series specified"); this.loading.set(false); return; }
    this.http.get<any>('/api/series/'+slug).subscribe({
      next: (res) => { this.series.set(res.data ?? res); this.loading.set(false); },
      error: () => { this.error.set("Series not found"); this.loading.set(false); },
    });
  }
}
