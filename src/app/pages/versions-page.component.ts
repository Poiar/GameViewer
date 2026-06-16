import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from "@angular/core";
import { ReleasesService } from "../services/releases.service";
import { AuthService } from "../services/auth.service";
import { Release } from "../types/game.types";

@Component({
  selector: "app-versions-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Game Versions & DLC</h2>
      <p>Available releases per version</p>
    </div>
    @if (loading()) {
      <div class="center-message"><div class="spinner"></div><p>Loading...</p></div>
    }
    <div class="grid">
      @for (rel of releases(); track rel.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-icon">🔖</div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ rel.releaseGroup?.masterGame?.title ?? rel.title ?? "Unknown" }}</h3>
              <div class="card-meta">
                <span class="tag tag-accent">{{ rel.releaseGroup?.editionType?.name ?? "Original" }}</span>
                <span class="tag tag-muted">{{ rel.provider?.name ?? "" }}</span>
              </div>
            </div>
          </div>
          <div class="card-platforms">
            <span class="platforms-label">Plays on:</span>
            <span class="platforms-list">{{ rel.playableOn?.join(", ") ?? "" }}</span>
          </div>
        </article>
      }
    </div>
    @if (!loading() && releases().length === 0) {
      <p class="panel-empty">No versions loaded from API.</p>
    }
  `,
  styles: [`
    .center-message { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: var(--text-muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .panel-empty { text-align: center; color: var(--text-muted); padding: 40px 0; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsPageComponent implements OnInit {
  private releasesService = inject(ReleasesService);
  private auth = inject(AuthService);

  releases = signal<Release[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const load = () => {
      if (this.auth.isLoggedIn()) {
        this.releasesService.getReleases().subscribe({
          next: (data) => { this.releases.set(data); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      } else {
        setTimeout(load, 500);
      }
    };
    load();
  }
}
