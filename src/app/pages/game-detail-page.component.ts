import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { GamesService } from "../services/games.service";
import { MasterGameDetail } from "../types/game.types";

@Component({
  selector: "app-game-detail-page",
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (loading()) {
      <div class="center-message"><div class="spinner"></div><p>Loading...</p></div>
    } @else if (error()) {
      <div class="center-message">
        <p>{{ error() }}</p>
        <a routerLink="/games" class="back-link">← Back to Games</a>
      </div>
    } @else if (game(); as g) {
      <a routerLink="/games" class="back-link">← Back to Games</a>

      <div class="detail-hero">
        <div class="detail-cover">
          @if (g.coverImageUrl) {
            <img [src]="g.coverImageUrl" [alt]="g.title" />
          } @else {
            <div class="cover-placeholder">🎮</div>
          }
        </div>
        <div class="detail-meta">
          <h1>{{ g.title }}</h1>
          <div class="detail-tags">
            @for (genre of g.genres ?? []; track genre.id) {
              <span class="tag tag-genre">{{ genre.name }}</span>
            }
            <span class="tag">{{ g.firstReleaseYear }}</span>
            @if (g.series) {
              <span class="tag tag-accent">Series: {{ g.series.name }}</span>
            }
            @if (g.alternativeTitles.length) {
              <span class="tag tag-muted">a.k.a. {{ g.alternativeTitles.join(", ") }}</span>
            }
          </div>
          @if (g.description) {
            <p class="detail-desc">{{ g.description }}</p>
          }
        </div>
      </div>

      <!-- Release Groups -->
      @if (g.releaseGroups?.length) {
        <div class="section">
          <h2 class="section-title">Releases</h2>
          @for (rg of g.releaseGroups; track rg.id) {
            <div class="release-group-card">
              <div class="rg-header">
                <span class="rg-edition">{{ rg.editionType?.name ?? "Original" }}</span>
                @if (rg.editionName) { <span class="rg-name">{{ rg.editionName }}</span> }
                @if (rg.releaseYear) { <span class="rg-year">{{ rg.releaseYear }}</span> }
              </div>
              <div class="rg-releases">
                @for (rel of rg.releases; track rel.id) {
                  <div class="release-row" [class.owned]="!!rel.userOwns">
                    <span class="rel-platform">{{ rel.playableOn?.join(", ") ?? "—" }}</span>
                    <span class="rel-provider">{{ rel.provider?.name ?? "—" }}</span>
                    <span class="rel-format">{{ rel.mediaFormat?.name ?? "" }}</span>
                    @if (rel.region) { <span class="rel-region">{{ rel.region }}</span> }
                    <span class="rel-multiplayer">
                      @if (rel.localMultiplayer === 'Yes') { 🎮 Local }
                      @if (rel.onlineMultiplayer === 'Yes') { 🌐 Online }
                    </span>
                    @if (rel.userOwns) {
                      <span class="rel-owned-badge" title="You own this">✓</span>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- DLCs -->
      @if (g.dlcs?.length) {
        <div class="section">
          <h2 class="section-title">DLCs & Expansions</h2>
          <div class="dlc-grid">
            @for (dlc of g.dlcs; track dlc.id) {
              <div class="dlc-card">
                <div class="dlc-card-main">
                  <span class="dlc-title">{{ dlc.title }}</span>
                  <span class="dlc-year">{{ dlc.firstReleaseYear }}</span>
                  <span class="dlc-type">{{ dlc.dlcType }}</span>
                </div>
                @if (dlc.releases?.length) {
                  <div class="dlc-releases">
                    @for (dr of dlc.releases; track dr.id) {
                      <div class="dlc-release-row" [class.owned]="!!$any(dr).userOwns">
                        <span class="dr-provider">{{ $any(dr).provider?.name ?? "—" }}</span>
                        <span class="dr-format">{{ $any(dr).mediaFormat?.name ?? "" }}</span>
                        @if ($any(dr).onDiscForConsoleOnly) { <span class="dr-disc">💿 On Disc</span> }
                        @if ($any(dr).userOwns) { <span class="rel-owned-badge" title="You own this">✓</span> }
                      </div>
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

    .center-message { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; color: var(--text-muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .back-link { display: inline-block; color: var(--accent); text-decoration: none; font-size: 14px; font-weight: 500; margin-bottom: 24px; }
    .back-link:hover { text-decoration: underline; }

    .detail-hero { display: flex; gap: 32px; margin-bottom: 40px; }
    .detail-cover { width: 200px; height: 280px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: var(--bg-tertiary); }
    .detail-cover img { width: 100%; height: 100%; object-fit: cover; }
    .cover-placeholder { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 64px; opacity: 0.3; }

    .detail-meta h1 { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.03em; margin-bottom: 12px; }
    .detail-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .detail-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.6; max-width: 640px; }

    .tag { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-subtle); }
    .tag-genre { background: rgb(6, 214, 160, 0.1); color: var(--accent-secondary); border-color: rgb(6, 214, 160, 0.25); }
    .tag-accent { background: var(--accent-glow); color: var(--accent); border-color: var(--border-accent); }
    .tag-muted { opacity: 0.7; }

    .section { margin-bottom: 40px; }
    .section-title { font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 16px; letter-spacing: -0.01em; }

    .release-group-card { background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 12px; }
    .rg-header { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
    .rg-edition { font-weight: 700; font-size: 15px; color: var(--accent); }
    .rg-name { font-size: 13px; color: var(--accent-secondary); }
    .rg-year { font-size: 13px; color: var(--text-muted); }

    .rg-releases { display: flex; flex-direction: column; gap: 6px; }
    .release-row { display: flex; gap: 14px; align-items: center; padding: 8px 12px; background: var(--bg-tertiary); border-radius: var(--radius-sm); font-size: 13px; transition: all .15s; }
    .release-row.owned { background: rgba(6, 214, 160, 0.06); border-left: 3px solid var(--accent-secondary); border-radius: 0 var(--radius-sm) var(--radius-sm) 0; padding-left: 9px; }
    .rel-platform { font-weight: 600; color: var(--text-primary); min-width: 80px; }
    .rel-provider { color: var(--text-secondary); }
    .rel-format { color: var(--text-muted); font-size: 11px; }
    .rel-region { background: var(--bg-card); padding: 1px 8px; border-radius: 10px; font-size: 11px; color: var(--text-muted); }
    .rel-multiplayer { margin-left: auto; font-size: 12px; color: var(--text-muted); }
    .rel-owned-badge {
      width: 20px; height: 20px; border-radius: 50%;
      background: var(--accent-secondary); color: #000;
      font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; line-height: 1;
    }

    .dlc-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .dlc-card { padding: 12px 16px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px; }
    .dlc-card-main { display: flex; gap: 10px; align-items: center; }
    .dlc-title { font-weight: 600; color: var(--text-primary); }
    .dlc-year { color: var(--text-secondary); font-size: 12px; }
    .dlc-type { color: var(--text-muted); font-size: 11px; margin-left: auto; }
    .dlc-releases { display: flex; flex-direction: column; gap: 4px; }
    .dlc-release-row { display: flex; align-items: center; gap: 8px; padding: 4px 10px; background: var(--bg-tertiary); border-radius: 6px; font-size: 12px; transition: all .15s; }
    .dlc-release-row.owned { background: rgba(6,214,160,.06); border-left: 3px solid var(--accent-secondary); border-radius: 0 6px 6px 0; padding-left: 7px; }
    .dr-provider { color: var(--text-secondary); font-weight: 500; }
    .dr-format { color: var(--text-muted); }
    .dr-disc { color: var(--accent-info); font-size: 11px; }

    @media (width <= 768px) {
      .detail-hero { flex-direction: column; align-items: center; text-align: center; }
      .release-row { flex-wrap: wrap; }
      .rel-multiplayer { margin-left: 0; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gamesService = inject(GamesService);

  game = signal<MasterGameDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get("slug");
    if (!slug) {
      this.error.set("No game specified");
      this.loading.set(false);
      return;
    }
    this.gamesService.getGameBySlug(slug).subscribe({
      next: (g) => {
        this.game.set(g);
        this.loading.set(false);
      },
      error: () => { this.error.set("Game not found"); this.loading.set(false); },
    });
  }
}
