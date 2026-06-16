import { Component, ChangeDetectionStrategy, signal, OnInit, inject } from "@angular/core";
import { CollectionsService } from "../services/collections.service";
import { AuthService } from "../services/auth.service";
import { Collection } from "../types/game.types";

@Component({
  selector: "app-collections-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Collections</h2>
      <p>Grouped releases across platforms</p>
    </div>
    @if (loading()) {
      <div class="center-message"><div class="spinner"></div><p>Loading...</p></div>
    }
    <div class="grid">
      @for (coll of collections(); track coll.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-icon">📦</div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ coll.title }}</h3>
              <div class="card-meta">
                @if (coll.releaseYear) { <span class="tag">{{ coll.releaseYear }}</span> }
              </div>
            </div>
          </div>
          @if (coll.releases?.length) {
            <div class="card-platforms">
              <span class="platforms-label">Platforms:</span>
              <span class="platforms-list">{{ platforms(coll) }}</span>
            </div>
          }
          <div class="card-items">
            @for (rel of coll.releases ?? []; track rel.id) {
              <div class="mini-item">
                <span class="mini-label">{{ rel.releaseGroup?.masterGame?.title ?? rel.title ?? "" }}</span>
                <span class="mini-detail">{{ rel.releaseGroup?.editionType?.name ?? "" }} · {{ rel.playableOn?.join(", ") ?? "" }}</span>
              </div>
            }
          </div>
        </article>
      }
    </div>
    <div class="pagination">
      <button class="pagination-btn" [disabled]="page() === 1" (click)="prevPage()">← Previous</button>
      <span class="pagination-info">Page {{ page() }} of {{ totalPages() }}</span>
      <button class="pagination-btn" [disabled]="page() >= totalPages()" (click)="nextPage()">Next →</button>
    </div>
  `,
  styles: [`
    .center-message { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; color: var(--text-muted); }
    .spinner { width: 32px; height: 32px; border: 3px solid var(--bg-tertiary); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsPageComponent implements OnInit {
  private collService = inject(CollectionsService);
  private auth = inject(AuthService);
  collections = signal<Collection[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = 12;

  totalPages = signal(1);

  ngOnInit(): void {
    const load = () => {
      if (this.auth.isLoggedIn()) {
        this.loadData();
      } else {
        setTimeout(load, 500);
      }
    };
    load();
  }

  private loadData(): void {
    this.collService.getCollections(this.page(), this.limit).subscribe({
      next: (data) => {
        this.collections.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  platforms(coll: Collection): string {
    const set = new Set<string>();
    coll.releases?.forEach((r) => r.playableOn?.forEach((p) => set.add(p)));
    return [...set].join(", ");
  }

  prevPage(): void { this.page.update((p) => Math.max(1, p - 1)); this.loadData(); }
  nextPage(): void { this.page.update((p) => Math.min(this.totalPages(), p + 1)); this.loadData(); }
}
