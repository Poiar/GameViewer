import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Component({
  selector: "app-stats-page", standalone: true, imports: [],
  template: `
    <div class="st-header"><h2>Stats &amp; Analytics</h2><p>Your collection by the numbers</p></div>
    @if (loading()) { <div class="st-load"><div class="spinner"></div></div> }
    @else if (error()) { <div class="st-err">{{ error() }}</div> }
    @else if (stats()) { @let s = stats()!;
      <div class="st-grid">
        <div class="st-card"><div class="stc-val">{{ s.totalUserOwned }}</div><div class="stc-lbl">You Own</div><div class="stc-icon">🏆</div></div>
        <div class="st-card"><div class="stc-val">{{ s.totalGames }}</div><div class="stc-lbl">Total Games</div><div class="stc-icon">🎮</div></div>
        <div class="st-card"><div class="stc-val">{{ s.totalReleases }}</div><div class="stc-lbl">Releases</div><div class="stc-icon">💿</div></div>
        <div class="st-card"><div class="stc-val">{{ s.totalSeries }}</div><div class="stc-lbl">Series</div><div class="stc-icon">📚</div></div>
        <div class="st-card"><div class="stc-val">{{ s.totalCollections }}</div><div class="stc-lbl">Collections</div><div class="stc-icon">📦</div></div>
        <div class="st-card"><div class="stc-val">{{ s.totalFavorites }}</div><div class="stc-lbl">Favorites</div><div class="stc-icon">⭐</div></div>
      </div>
      <div class="st-section"><h3>Platform Distribution</h3>
        @if (s.platformDistribution?.length) {
          <div class="st-bars">
            @for (p of s.platformDistribution; track p.slug) {
              <div class="st-bar-row"><span class="stb-label">{{ p.name }}</span>
                <div class="stb-track"><div class="stb-fill" [style.width.%]="pct(p.count, maxPlat())"></div></div>
                <span class="stb-val">{{ p.count }}</span>
              </div>
            }
          </div>
        }
      </div>
      <div class="st-section"><h3>Genre Breakdown</h3>
        @if (s.genreBreakdown?.length) {
          <div class="st-bars">
            @for (g of s.genreBreakdown; track g.slug) {
              <div class="st-bar-row"><span class="stb-label">{{ g.name }}</span>
                <div class="stb-track"><div class="stb-fill stb-fill--genre" [style.width.%]="pct(g.count, maxGenre())"></div></div>
                <span class="stb-val">{{ g.count }}</span>
              </div>
            }
          </div>
        }
      </div>
      <div class="st-section"><h3>Collection Completion</h3>
        @if (s.collectionCompleteness?.length) {
          <div class="st-bars">
            @for (cc of s.collectionCompleteness; track cc.collectionId) {
              <div class="st-bar-row"><span class="stb-label">{{ cc.title }}</span>
                <div class="stb-track"><div class="stb-fill stb-fill--coll" [style.width.%]="cc.total > 0 ? (cc.owned/cc.total*100) : 0"></div></div>
                <span class="stb-val">{{ cc.owned }}/{{ cc.total }}</span>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .st-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle); }
    .st-header h2 { font-size: 28px; font-weight: 800; letter-spacing: -.04em; background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-warn) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .st-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .st-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; margin-bottom: 32px; }
    .st-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px; text-align: center; transition: transform .2s; }
    .st-card:hover { transform: translateY(-2px); }
    .stc-val { font-size: 28px; font-weight: 800; color: var(--accent); margin-bottom: 4px; }
    .stc-lbl { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
    .stc-icon { font-size: 28px; margin-top: 8px; opacity: .5; }
    .st-section { margin-bottom: 32px; }
    .st-section h3 { font-size: 18px; font-weight: 700; margin-bottom: 14px; color: var(--text-primary); }
    .st-bars { display: flex; flex-direction: column; gap: 8px; }
    .st-bar-row { display: flex; align-items: center; gap: 12px; }
    .stb-label { width: 140px; flex-shrink: 0; font-size: 12px; color: var(--text-secondary); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .stb-track { flex: 1; height: 10px; background: var(--bg-tertiary); border-radius: 5px; overflow: hidden; }
    .stb-fill { height: 100%; background: var(--accent); border-radius: 5px; transition: width .5s ease-out; min-width: 2px; }
    .stb-fill--genre { background: var(--accent-secondary); }
    .stb-fill--coll { background: var(--accent-info); }
    .stb-val { width: 50px; flex-shrink: 0; font-size: 12px; color: var(--text-muted); font-weight: 600; text-align: right; }
    .st-load { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .st-err { text-align: center; padding: 80px 0; color: var(--text-muted); }
    @media (max-width: 640px) { .stb-label { width: 80px; } }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsPageComponent implements OnInit {
  private http = inject(HttpClient);
  stats = signal<any>(null); loading = signal(true); error = signal<string | null>(null);
  ngOnInit(): void {
    this.http.get<any>('/api/dashboard/stats').subscribe({
      next: (res) => { this.stats.set(res.data ?? res); this.loading.set(false); },
      error: () => { this.error.set("Could not load stats"); this.loading.set(false); },
    });
  }
  pct(count: number, max: number): number { return max > 0 ? (count / max) * 100 : 0; }
  maxPlat(): number { return Math.max(...(this.stats()?.platformDistribution ?? []).map((d: any) => d.count), 1); }
  maxGenre(): number { return Math.max(...(this.stats()?.genreBreakdown ?? []).map((d: any) => d.count), 1); }
}
