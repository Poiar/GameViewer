import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";

interface DlcDetail {
  id: number; title: string; firstReleaseYear: number | null; dlcType: string;
  masterGame?: { id: number; title: string; slug: string };
  dlcReleases: Array<{
    id: number; releaseDate: string | null; onDiscForConsoleOnly: boolean;
    provider?: { name: string; slug: string } | null;
    mediaFormat?: { name: string } | null;
    userOwns?: { id: number; condition: string | null; location: string | null; purchasePrice: string | null } | null;
    compatibility?: Array<{ release?: { id: number; title: string | null } }>;
  }>;
}

@Component({
  selector: "app-dlc-detail-page", standalone: true, imports: [RouterLink],
  template: `
    <a routerLink="/dlc" class="dd-back">← Back to DLCs</a>
    @if (loading()) { <div class="dd-load"><div class="spinner"></div></div> }
    @else if (error()) { <div class="dd-err">{{ error() }}</div> }
    @else if (dlc(); as d) {
      <div class="dd-hero">
        <h1>{{ d.title }}</h1>
        <div class="dd-meta">
          <span class="dd-type" [class]="'dt-' + d.dlcType.toLowerCase()">{{ d.dlcType }}</span>
          @if (d.firstReleaseYear) { <span class="dd-year">{{ d.firstReleaseYear }}</span> }
          @if (d.masterGame) {
            <a class="dd-game-link" [routerLink]="['/games', d.masterGame.slug]">{{ d.masterGame.title }}</a>
          }
        </div>
      </div>

      @if (d.dlcReleases?.length) {
        <div class="dd-section">
          <h2 class="dd-section-title">Releases</h2>
          <div class="dd-releases">
            @for (dr of d.dlcReleases; track dr.id) {
              <div class="dd-release-row" [class.owned]="!!dr.userOwns">
                <div class="ddr-main">
                  <span class="ddr-provider">{{ dr.provider?.name ?? "—" }}</span>
                  <span class="ddr-format">{{ dr.mediaFormat?.name ?? "" }}</span>
                  @if (dr.onDiscForConsoleOnly) { <span class="ddr-disc">💿 On Disc</span> }
                  @if (dr.releaseDate) { <span class="ddr-date">{{ dr.releaseDate }}</span> }
                </div>
                @if (dr.userOwns) {
                  <div class="ddr-owned">
                    <span class="ddr-badge">✓</span>
                    @if (dr.userOwns.condition) { <span class="ddr-cond">{{ dr.userOwns.condition }}</span> }
                    @if (dr.userOwns.location) { <span class="ddr-loc" title="Location">📍 {{ dr.userOwns.location }}</span> }
                    @if (dr.userOwns.purchasePrice) { <span class="ddr-price" title="Price">💲 {{ dr.userOwns.purchasePrice }}</span> }
                  </div>
                }
                @if (dr.compatibility?.length) {
                  <div class="ddr-compat">
                    <span class="ddrc-label">Compatible with:</span>
                    @for (c of dr.compatibility; track c.release?.id) {
                      <span class="ddrc-rel">{{ c.release?.title ?? "—" }}</span>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .dd-back { display: inline-block; color: var(--accent); text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .dd-back:hover { text-decoration: underline; }
    .dd-hero { margin-bottom: 28px; }
    .dd-hero h1 { font-size: 28px; font-weight: 800; letter-spacing: -.03em; margin-bottom: 10px; }
    .dd-meta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .dd-type { padding: 3px 12px; border-radius: 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; background: var(--accent-glow); color: var(--accent); }
    .dt-dlc { background: rgba(6,214,160,.12); color: var(--accent-secondary); }
    .dt-expansion { background: rgba(79,195,247,.12); color: var(--accent-info); }
    .dt-cosmetic { background: rgba(251,191,36,.12); color: #fbbf24; }
    .dd-year { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: var(--bg-tertiary); color: var(--text-secondary); }
    .dd-game-link { color: var(--accent); text-decoration: none; font-size: 13px; font-weight: 600; padding: 3px 10px; border-radius: 12px; background: var(--accent-glow); }
    .dd-game-link:hover { text-decoration: underline; }
    .dd-section { margin-bottom: 32px; }
    .dd-section-title { font-size: 18px; font-weight: 700; margin-bottom: 14px; color: var(--text-primary); }
    .dd-releases { display: flex; flex-direction: column; gap: 4px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); overflow: hidden; }
    .dd-release-row { padding: 12px 18px; transition: background .15s; }
    .dd-release-row:hover { background: var(--bg-elevated); }
    .dd-release-row + .dd-release-row { border-top: 1px solid var(--border-subtle); }
    .dd-release-row.owned { background: rgba(6,214,160,.03); border-left: 3px solid var(--accent-secondary); padding-left: 15px; }
    .ddr-main { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; margin-bottom: 4px; }
    .ddr-provider { font-weight: 600; color: var(--text-primary); font-size: 14px; }
    .ddr-format { font-size: 11px; color: var(--text-muted); }
    .ddr-disc { font-size: 11px; color: var(--accent-info); }
    .ddr-date { font-size: 12px; color: var(--text-muted); margin-left: auto; }
    .ddr-owned { display: flex; align-items: center; gap: 6px; }
    .ddr-badge { width: 20px; height: 20px; border-radius: 50%; background: var(--accent-secondary); color: #000; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ddr-cond { padding: 1px 7px; border-radius: 8px; font-size: 10px; font-weight: 700; background: rgba(6,214,160,.15); color: var(--accent-secondary); }
    .ddr-loc { font-size: 11px; color: var(--text-muted); }
    .ddr-price { font-size: 11px; color: var(--accent-warn); font-weight: 600; }
    .ddr-compat { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; margin-top: 6px; }
    .ddrc-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
    .ddrc-rel { padding: 1px 7px; border-radius: 6px; font-size: 10px; background: var(--bg-tertiary); color: var(--text-secondary); }
    .dd-load { display: flex; justify-content: center; padding: 80px 0; }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .dd-err { text-align: center; padding: 80px 0; color: var(--text-muted); }
  `], changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DlcDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute); private http = inject(HttpClient);
  dlc = signal<DlcDetail | null>(null); loading = signal(true); error = signal<string | null>(null);
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) { this.error.set("No DLC specified"); this.loading.set(false); return; }
    this.http.get<any>('/api/dlc/'+id).subscribe({
      next: (res) => { this.dlc.set(res.data ?? res); this.loading.set(false); },
      error: () => { this.error.set("DLC not found"); this.loading.set(false); },
    });
  }
}
