import { Component, ChangeDetectionStrategy, signal, computed } from "@angular/core";
import {
  allCollections,
  Collection,
} from "../../classes/model";

@Component({
  selector: "app-collections-page",
  standalone: true,
  template: `
    <div class="page-header">
      <h2>Collections</h2>
      <p>Grouped releases across platforms</p>
    </div>
    <div class="grid">
      @for (collection of paginatedCollections(); track collection.id) {
        <article class="card">
          <div class="card-header">
            <div class="card-icon">📦</div>
            <div class="card-title-wrap">
              <h3 class="card-title">{{ collection.title }}</h3>
              <div class="card-meta">
                <span class="tag tag-accent">{{ collection.getVersionTypes() }}</span>
                @if (collection.releaseYear) {
                  <span class="tag">{{ collection.releaseYear }}</span>
                }
              </div>
            </div>
          </div>
          <div class="card-platforms">
            <span class="platforms-label">Platforms:</span>
            <span class="platforms-list">{{ collection.getPlayableOnTitles() }}</span>
          </div>
          <div class="card-items">
            @for (gameVersion of collection.gameVersions; track gameVersion.id) {
              <div class="mini-item">
                <span class="mini-label">{{ gameVersion.superVersion.game.title }}</span>
                <span class="mini-detail">{{ gameVersion.superVersion.getVersionType() }} · {{ gameVersion.getPlayableOnTitles() }}</span>
              </div>
            }
            @for (dlcVersion of collection.dlcVersions; track dlcVersion.id) {
              <div class="mini-item mini-dlc">
                <span class="mini-label">DLC: {{ dlcVersion.dlc.title }}</span>
                <span class="mini-detail">{{ dlcVersion.getPlayableOnTitles() }}</span>
              </div>
            }
          </div>
        </article>
      }
    </div>
    @if (collectionsTotalPages() > 1) {
      <div class="pagination">
        <button class="pagination-btn" [disabled]="collectionsPage() === 0" (click)="prevCollectionsPage()">← Previous</button>
        <span class="pagination-info">Page {{ collectionsPage() + 1 }} of {{ collectionsTotalPages() }}</span>
        <button class="pagination-btn" [disabled]="collectionsPage() >= collectionsTotalPages() - 1" (click)="nextCollectionsPage()">Next →</button>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsPageComponent {
  collections: Collection[] = allCollections;
  readonly collectionsPageSize = 12;
  collectionsPage = signal(0);
  collectionsTotalPages = computed(() => Math.ceil(this.collections.length / this.collectionsPageSize));

  paginatedCollections = computed(() => {
    const start = this.collectionsPage() * this.collectionsPageSize;
    return this.collections.slice(start, start + this.collectionsPageSize);
  });

  nextCollectionsPage(): void {
    this.collectionsPage.update((p) => Math.min(p + 1, this.collectionsTotalPages() - 1));
  }

  prevCollectionsPage(): void {
    this.collectionsPage.update((p) => Math.max(p - 1, 0));
  }
}
