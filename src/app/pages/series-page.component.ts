import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from "@angular/core";
import { SeriesService } from "../services/series.service";
import { AuthService } from "../services/auth.service";
import { Series } from "../types/game.types";

@Component({
  selector: "app-series-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Series</h2>
      <p>Game franchises and their titles</p>
    </div>
    @if (loading()) {
      <div class="center-message"><div class="spinner"></div><p>Loading...</p></div>
    }
    <div class="grid">
      @for (s of series(); track s.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-icon">📚</div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ s.name }}</h3>
              <div class="card-meta">{{ s._count?.games ?? s.games?.length ?? 0 }} titles</div>
            </div>
          </div>
          @if (s.games?.length) {
            <div class="card-items">
              @for (game of s.games; track game.id) {
                <div class="mini-item">
                  <span class="mini-label">{{ game.title }}</span>
                  <span class="mini-detail">{{ game.firstReleaseYear }}</span>
                </div>
              }
            </div>
          }
        </article>
      }
    </div>
  `,
  styles: [`
    .center-message { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: var(--text-muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeriesPageComponent implements OnInit {
  private seriesService = inject(SeriesService);
  private auth = inject(AuthService);

  series = signal<Series[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    const load = () => {
      if (this.auth.isLoggedIn()) {
        this.seriesService.getSeries().subscribe({
          next: (data) => { this.series.set(data); this.loading.set(false); },
          error: () => this.loading.set(false),
        });
      } else {
        setTimeout(load, 500);
      }
    };
    load();
  }
}
