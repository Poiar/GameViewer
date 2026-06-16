import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-timeline-page", standalone: true, imports: [RouterLink],
  template: `
    <div class="tl-header"><h2>Timeline</h2><p>{{ total() }} games across {{ decades().length }} decades</p></div>
    @if (loading()) { <div class="tl-load"><div class="spinner"></div></div> }
    @else {
      @for (decade of decades(); track decade[0]) {
        <div class="tl-decade">
          <h3 class="tl-decade-title">{{ decade[0] }}s</h3>
          <div class="tl-years">
            @for (year of yearsInDecade(decade[0]); track year) {
              @if (gamesByYear()[year]?.length) {
                <div class="tl-year">
                  <h4 class="tl-year-title">{{ year }} <span class="tly-count">{{ gamesByYear()[year].length }} games</span></h4>
                  <div class="tl-grid">
                    @for (game of gamesByYear()[year]; track game.id; let i = $index) {
                      <a class="tl-card" [class.owned]="$any(game).ownedReleases?.length > 0" [routerLink]="['/games', game.slug]" [style.--idx]="i">
                        <div class="tlc-cover">
                          @if (game.coverImageUrl) { <img [src]="game.coverImageUrl" [alt]="game.title" loading="lazy" /> }
                          @else { <span class="tlc-ph">🎮</span> }
                          @if ($any(game).ownedReleases?.length > 0) { <span class="tlc-owned">✓</span> }
                        </div>
                        <div class="tlc-body"><span class="tlc-title">{{ game.title }}</span></div>
                      </a>
                    }
                  </div>
                </div>
              }
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .tl-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle); }
    .tl-header h2 { font-size: 28px; font-weight: 800; letter-spacing: -.04em; background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-info) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .tl-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .tl-decade { margin-bottom: 36px; }
    .tl-decade-title { font-size: 22px; font-weight: 800; color: var(--accent); margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid var(--border-accent); }
    .tl-year { margin-bottom: 20px; }
    .tl-year-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
    .tly-count { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-left: 8px; }
    .tl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
    .tl-card { border-radius: var(--radius-md); overflow: hidden; background: var(--bg-card); border: 1px solid var(--border-subtle); text-decoration: none; display: block; transition: transform .2s; animation: in 300ms ease-out both; animation-delay: calc(var(--idx)*25ms); position: relative; }
    .tl-card:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,.4); }
    .tl-card.owned { border-color: rgba(6,214,160,.25); }
    .tl-card.owned:hover { box-shadow: 0 8px 20px rgba(6,214,160,.1); }
    @keyframes in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .tlc-cover { width: 100%; aspect-ratio: 2/3; overflow: hidden; background: var(--bg-tertiary); position: relative; }
    .tlc-cover img { width: 100%; height: 100%; object-fit: cover; }
    .tlc-ph { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 28px; opacity: .3; }
    .tlc-owned { position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; border-radius: 50%; background: var(--accent-secondary); color: #000; font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center; z-index: 2; }
    .tlc-body { padding: 6px 8px; }
    .tlc-title { font-size: 11px; font-weight: 600; color: var(--text-primary); line-height: 1.3; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .tl-load { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelinePageComponent implements OnInit {
  private http = inject(HttpClient);
  games = signal<any[]>([]); loading = signal(true); total = signal(0);

  ngOnInit(): void {
    this.http.get<any>('/api/games?limit=2000&sort=year&order=asc').subscribe({
      next: (res) => { const gs = res.data ?? res; this.games.set(gs); this.total.set(gs.length); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  gamesByYear(): Record<number, any[]> {
    const map: Record<number, any[]> = {};
    this.games().forEach((g: any) => {
      const year = g.firstReleaseYear || 0;
      if (year < 1970) return; // skip placeholder years
      if (!map[year]) map[year] = [];
      map[year].push(g);
    });
    return map;
  }

  decades(): [number, number[]][] {
    const map = this.gamesByYear();
    const years = Object.keys(map).map(Number).sort();
    if (years.length === 0) return [];
    const minDecade = Math.floor(years[0] / 10) * 10;
    const maxDecade = Math.floor(years[years.length - 1] / 10) * 10;
    const result: [number, number[]][] = [];
    for (let d = maxDecade; d >= minDecade; d -= 10) {
      const decadeYears = years.filter((y) => y >= d && y < d + 10);
      if (decadeYears.length > 0) result.push([d, decadeYears]);
    }
    return result;
  }

  yearsInDecade(decade: number): number[] {
    const years: number[] = [];
    for (let y = decade + 9; y >= decade; y--) years.push(y);
    return years;
  }
}
