import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";

interface ProviderItem { id: number; name: string; slug: string; }

@Component({
  selector: "app-providers-page", standalone: true, imports: [RouterLink],
  template: `
    <div class="p-header">
      <h2>Providers</h2>
      <p>{{ providers().length }} providers in the catalog</p>
    </div>
    @if (loading()) {
      <div class="p-loader"><div class="spinner"></div></div>
    } @else {
      <div class="p-grid">
        @for (prov of providers(); track prov.id; let i = $index) {
          <a class="p-card" [routerLink]="['/games']" [queryParams]="{provider: prov.slug}" [style.--idx]="i">
            <div class="pc-icon">{{ icon(prov.name) }}</div>
            <h3 class="pc-name">{{ prov.name }}</h3>
            <span class="pc-arrow">→</span>
          </a>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    .p-header { margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid var(--border-subtle); }
    .p-header h2 { font-size: 28px; font-weight: 800; letter-spacing: -.04em; background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-warn) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
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
    .pc-arrow { font-size: 14px; color: var(--accent); opacity: 0; transition: opacity .15s; margin-top: 4px; }
    .p-card:hover .pc-arrow { opacity: 1; }
    .p-loader { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProvidersPageComponent implements OnInit {
  private http = inject(HttpClient);
  providers = signal<ProviderItem[]>([]); loading = signal(true);

  ngOnInit(): void {
    this.http.get<any>('/api/lookup/providers').subscribe({
      next: (res) => { this.providers.set(res.data ?? res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  icon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('physical')) return '💿';
    if (n.includes('steam')) return '🚂';
    if (n.includes('epic')) return '🏰';
    if (n.includes('gog')) return '📦';
    if (n.includes('microsoft') || n.includes('xbox')) return '🟢';
    if (n.includes('playstation') || n.includes('sony')) return '🎮';
    if (n.includes('nintendo')) return '🔴';
    if (n.includes('origin') || n.includes('ea')) return '🎯';
    if (n.includes('ubisoft') || n.includes('uplay')) return '🟣';
    if (n.includes('battle.net') || n.includes('blizzard')) return '🟦';
    return '🏪';
  }
}
