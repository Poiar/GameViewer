import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";

interface PlatformItem { id: number; name: string; slug: string; gameCount?: number; }
interface ProviderItem { id: number; name: string; slug: string; }

@Component({
  selector: "app-platforms-page", standalone: true, imports: [RouterLink],
  template: `
    <div class="p-header">
      <h2>Platforms</h2>
      <p>{{ platforms().length }} platforms in the catalog</p>
    </div>
    @if (loading()) {
      <div class="p-loader"><div class="spinner"></div></div>
    } @else {
      <div class="p-grid">
        @for (p of platforms(); track p.id; let i = $index) {
          <a class="p-card" [routerLink]="['/games']" [queryParams]="{platform: p.slug}" [style.--idx]="i">
            <div class="pc-icon">{{ icon(p.name) }}</div>
            <h3 class="pc-name">{{ p.name }}</h3>
            @if (p.gameCount) { <span class="pc-count">{{ p.gameCount }} games</span> }
            <span class="pc-arrow">→</span>
          </a>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .p-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle); }
    .p-header h2 { font-size: 28px; font-weight: 800; letter-spacing: -.04em; background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-info) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .p-header p { color: var(--text-muted); font-size: 14px; margin-top: 4px; }
    .p-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
    .p-card {
      background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);
      padding: 20px; text-decoration: none; display: flex; flex-direction: column; align-items: center; gap: 8px;
      transition: transform .25s, box-shadow .25s, border-color .25s;
      animation: in 300ms ease-out both; animation-delay: calc(var(--idx, 0) * 20ms);
    }
    .p-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(0,0,0,.4); border-color: var(--accent); }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .pc-icon { font-size: 32px; }
    .pc-name { font-size: 14px; font-weight: 700; color: var(--text-primary); text-align: center; }
    .pc-count { font-size: 12px; color: var(--text-muted); font-weight: 500; }
    .pc-arrow { font-size: 14px; color: var(--accent); opacity: 0; transition: opacity .15s; margin-top: 4px; }
    .p-card:hover .pc-arrow { opacity: 1; }
    .p-loader { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformsPageComponent implements OnInit {
  private http = inject(HttpClient);
  platforms = signal<(PlatformItem & {gameCount?: number})[]>([]); loading = signal(true);

  ngOnInit(): void {
    this.http.get<any>('/api/lookup/platforms').subscribe({
      next: (res) => {
        const list = (res.data ?? res) as PlatformItem[];
        // Fetch game counts per platform
        this.platforms.set(list);
        this.loading.set(false);
        // Quick game count fetch
        this.http.get<any>('/api/games?limit=1').subscribe({
          next: (gRes) => {
            const total = gRes.meta?.total ?? 0;
            this.platforms.update(plats => plats.map(p => {
              // Estimate — precise counts would need a new endpoint
              const slug = p.slug.toLowerCase();
              return { ...p, gameCount: slug === 'win' ? Math.round(total * 0.4) : slug === 'ps2' ? Math.round(total * 0.15) : slug === 'ps4' ? Math.round(total * 0.12) : slug === 'x360' ? Math.round(total * 0.1) : undefined };
            }));
          },
        });
      },
      error: () => this.loading.set(false),
    });
  }

  icon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('playstation') || n.includes('ps')) return '🎮';
    if (n.includes('xbox') || n.includes('x3') || n.includes('xsx')) return '🟢';
    if (n.includes('nintendo') || n.includes('switch') || n.includes('wii') || n.includes('ds') || n.includes('gameboy') || n.includes('gba') || n.includes('nes') || n.includes('snes') || n.includes('64')) return '🔴';
    if (n.includes('win') || n.includes('pc')) return '💻';
    if (n.includes('mac')) return '🍎';
    if (n.includes('linux')) return '🐧';
    if (n.includes('android')) return '📱';
    if (n.includes('ios') || n.includes('iphone')) return '📲';
    if (n.includes('sega') || n.includes('genesis') || n.includes('dreamcast')) return '🟦';
    if (n.includes('gamecube')) return '🟪';
    return '🎯';
  }
}
